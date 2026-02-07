<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAuthenticated, getUser } from '@/utils/auth'
import { CheckCircleIcon, CheckIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()

// Redirect if not logged in or no room ID
onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  
  const roomId = route.query.id
  if (!roomId) {
    router.push('/rooms')
    return
  }
  
  fetchRoomDetails()
})

// 1. GET ROOM DATA from backend
const room = ref(null)
const loading = ref(true)
const error = ref(null)
const checkingAvailability = ref(false)
const availabilityResult = ref(null)
const availableRoomsCount = ref(0) // Track how many rooms are available
const availableRoomsList = ref([]) // List of available rooms with details
const selectedRoomId = ref(null) // User's selected room ID
const showRoomPicker = ref(false) // Toggle for room picker dropdown
const currentPage = ref(0) // Pagination for room picker
const roomsPerPage = 12 // Max 12 rooms per page (4 columns x 3 rows)

const fetchRoomDetails = async () => {
  try {
    const roomId = route.query.id
    const response = await fetch(`http://localhost:3000/api/rooms/${roomId}`)
    const data = await response.json()
    
    if (data.success) {
      // ✅ DEFENSIVE CODING: Validate room object structure
      if (!data.room || typeof data.room !== 'object') {
        console.warn('⚠️ API Response Validation Failed: Expected room object, got:', typeof data.room)
        error.value = 'Invalid room data received from server'
        setTimeout(() => router.push('/rooms'), 2000)
        return
      }

      // Map with safe property access
      room.value = {
        id: data.room.id ?? 'unknown',
        name: data.room.name ?? 'Unnamed Room',
        capacity: data.room.capacity ?? 'N/A',
        size: data.room.size ?? 'N/A',
        description: data.room.description ?? 'No description available',
        rates: {
          '3h': data.room.rates?.['3h'] ?? 0,
          '6h': data.room.rates?.['6h'] ?? 0,
          '12h': data.room.rates?.['12h'] ?? 0,
          '24h': data.room.rates?.['24h'] ?? 0
        },
        image: data.room.image ?? 'bg-gray-300',
        images: data.room.images ?? []
      }
    } else {
      error.value = 'Room not found'
      setTimeout(() => router.push('/rooms'), 2000)
    }
  } catch (err) {
    console.error('Error fetching room:', err)
    error.value = 'Failed to load room details'
    setTimeout(() => router.push('/rooms'), 2000)
  } finally {
    loading.value = false
  }
}

// 2. FORM STATE
const form = ref({
  date: new Date().toISOString().substr(0, 10), // Today
  time: '14:00',
  duration: '3h', // Default to 3 hours
  adults: 2,
  children: 0, // Number of children (max 2)
  childAges: [] // Array of ages for each child (0-13)
})

// Helper function to round time to nearest 5 minutes
const roundToNearest5Minutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  const roundedMinutes = Math.round(minutes / 5) * 5
  
  // Handle overflow (e.g., 14:58 -> 15:00)
  if (roundedMinutes === 60) {
    return `${String(hours + 1).padStart(2, '0')}:00`
  }
  
  return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`
}

// Watch for time changes and auto-round to 5-minute increments
watch(() => form.value.time, (newTime) => {
  const rounded = roundToNearest5Minutes(newTime)
  if (newTime !== rounded) {
    form.value.time = rounded
  }
})

// Reset availability when form values change
watch(
  () => [form.value.date, form.value.time, form.value.duration],
  () => {
    availabilityResult.value = null
  }
)

// Watch children count and adjust childAges array
watch(() => form.value.children, (newCount, oldCount) => {
  if (newCount > oldCount) {
    // Add default age (0) for new children
    for (let i = oldCount; i < newCount; i++) {
      form.value.childAges.push(0)
    }
  } else if (newCount < oldCount) {
    // Remove ages for removed children
    form.value.childAges = form.value.childAges.slice(0, newCount)
  }
})

// 3. DYNAMIC PRICING LOGIC
// Calculate base room price based on selected duration
const baseRoomPrice = computed(() => {
  if (!room.value) return 0
  return room.value.rates[form.value.duration]
})

// Calculate child add-on fees (₱150 for ages 7-13)
const childAddOnPrice = computed(() => {
  if (!form.value.childAges || form.value.childAges.length === 0) return 0
  
  // Count children aged 7-13
  const chargeableChildren = form.value.childAges.filter(age => age >= 7 && age <= 13).length
  return chargeableChildren * 150
})

// Total price including child surcharge
const currentPrice = computed(() => {
  return baseRoomPrice.value + childAddOnPrice.value
})

// 4. GUEST LIMIT LOGIC
// Superior Room allows up to 4 adults. Others max 2.
const maxAdults = computed(() => {
  if (!room.value) return 2
  return room.value.capacity && room.value.capacity.includes('4') ? 4 : 2
})

// Child management functions
const incrementChildren = () => {
  if (form.value.children < 2) {
    form.value.children++
  }
}

const decrementChildren = () => {
  if (form.value.children > 0) {
    form.value.children--
  }
}

// 5. CHECK AVAILABILITY
const checkAvailability = async () => {
  if (!room.value) return
  
  // Ensure time is rounded to 5-minute increments before checking
  form.value.time = roundToNearest5Minutes(form.value.time)
  
  checkingAvailability.value = true
  availabilityResult.value = null
  availableRoomsCount.value = 0
  availableRoomsList.value = []
  selectedRoomId.value = null
  showRoomPicker.value = false
  currentPage.value = 0
  
  try {
    const params = new URLSearchParams({
      checkInDate: form.value.date,
      checkInTime: form.value.time,
      duration: form.value.duration
    })
    
    const response = await fetch(`http://localhost:3000/api/rooms/${room.value.id}/check-availability?${params}`)
    const data = await response.json()
    
    if (data.success) {
      // ✅ DEFENSIVE CODING: Validate availability response structure
      if (!data || typeof data !== 'object') {
        console.warn('⚠️ API Response Validation Failed: Expected data object, got:', typeof data)
        availabilityResult.value = {
          success: false,
          available: false,
          message: 'Invalid response format from server'
        }
        return
      }

      availabilityResult.value = data
      // Store the count of available rooms with validation
      if (data.availableRooms && Array.isArray(data.availableRooms)) {
        availableRoomsCount.value = data.availableRooms.length
        availableRoomsList.value = data.availableRooms
          .filter(r => r && typeof r === 'object')
          .map(r => ({
            id: r.id ?? 'unknown',
            room_number: r.room_number ?? 'N/A',
            status: r.status ?? 'unknown'
          }))
        // Don't auto-select anymore - let user choose or use auto-assign
        selectedRoomId.value = null
      } else {
        availableRoomsCount.value = 0
        availableRoomsList.value = []
      }
    } else {
      availabilityResult.value = {
        success: false,
        available: false,
        message: data.message || 'Failed to check availability'
      }
    }
  } catch (err) {
    console.error('Error checking availability:', err)
    availabilityResult.value = {
      success: false,
      available: false,
      message: 'Network error. Please try again.'
    }
  } finally {
    checkingAvailability.value = false
  }
}

// Pagination helpers
const paginatedRooms = computed(() => {
  const start = currentPage.value * roomsPerPage
  const end = start + roomsPerPage
  return availableRoomsList.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(availableRoomsList.value.length / roomsPerPage)
})

const canGoNext = computed(() => {
  return currentPage.value < totalPages.value - 1
})

const canGoPrevious = computed(() => {
  return currentPage.value > 0
})

const nextPage = () => {
  if (canGoNext.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (canGoPrevious.value) {
    currentPage.value--
  }
}

const toggleRoomPicker = () => {
  showRoomPicker.value = !showRoomPicker.value
  if (showRoomPicker.value) {
    currentPage.value = 0 // Reset to first page when opening
  }
}

const selectRoom = (roomId) => {
  selectedRoomId.value = roomId
  // Optionally close the picker after selection
  // showRoomPicker.value = false
}

// 6. SUBMIT HANDLER
const proceedToBooking = () => {
  // Check availability first if not already checked
  if (!availabilityResult.value) {
    checkAvailability()
    return
  }
  
  // Only proceed if room is available
  if (!availabilityResult.value.available) {
    return
  }
  
  // ✅ VALIDATION: Ensure all child ages are selected
  if (form.value.children > 0) {
    // Check if any age is still at default (0) - which might be intentional
    // But ensure the array length matches the children count
    if (form.value.childAges.length !== form.value.children) {
      alert('Please select the age for each child before proceeding.')
      return
    }
    
    // Optional: Validate that all ages are valid numbers 0-13
    const hasInvalidAge = form.value.childAges.some(age => age < 0 || age > 13 || isNaN(age))
    if (hasInvalidAge) {
      alert('Please select valid ages (0-13 years) for all children.')
      return
    }
  }
  
  // Build query parameters
  const queryParams = {
    roomId: room.value.id, // Generic room type slug (e.g., "standard-room")
    date: form.value.date,
    time: form.value.time,
    duration: form.value.duration,
    adults: form.value.adults,
    children: form.value.children,
    childAges: form.value.childAges.join(','), // Comma-separated ages
    basePrice: baseRoomPrice.value,
    addOnTotal: childAddOnPrice.value,
    price: currentPrice.value,
    verified: 'true'
  }
  
  // If user manually selected a specific room, pass it
  if (selectedRoomId.value) {
    queryParams.selectedRoomId = selectedRoomId.value
  }
  
  // Push to the final Booking/Payment page with all details
  router.push({
    path: '/booking',
    query: queryParams
  })
}

const formatPrice = (p) => p.toLocaleString()
</script>

<template>
  <main class="min-h-screen bg-balai-bg font-sans flex items-start justify-center relative px-4 pt-32 pb-12">
    
    <div v-if="loading" class="text-center mt-20">
      <p class="text-balai-dark">Loading room details...</p>
    </div>

    <div v-else-if="error" class="text-center bg-white p-8 shadow-lg max-w-md mt-20">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <p class="text-sm text-gray-500">Redirecting to rooms...</p>
    </div>

    <div v-else-if="room" class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0"></div>
    </div>

    <div v-if="room" class="relative z-10 bg-white w-full max-w-5xl shadow-2xl rounded-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      
      <div class="w-full md:w-2/5 bg-gray-200 relative group min-h-[300px] md:min-h-full">
         <!-- Display real room image if available, otherwise show fallback -->
         <img 
           v-if="room.images && room.images.length > 0 && room.images.find(img => img.isPrimary)" 
           :src="room.images.find(img => img.isPrimary).path" 
           :alt="room.images.find(img => img.isPrimary).altText || room.name"
           class="absolute inset-0 w-full h-full object-cover" 
         />
         <div v-else :class="`absolute inset-0 ${room.image} bg-cover bg-center`"></div>
         <div class="absolute inset-0 bg-black/30"></div>
         
         <div class="absolute bottom-0 left-0 p-8 text-white w-full">
            <span class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 block">You are booking</span>
            <h2 class="font-serif text-3xl md:text-4xl mb-2">{{ room.name }}</h2>
            <p class="text-sm opacity-90 leading-relaxed">{{ room.tagline }}</p>
            
            <div class="mt-6 pt-6 border-t border-white/20">
               <div class="flex justify-between items-end">
                  <div>
                     <span class="block text-xs uppercase tracking-wider opacity-70">Total Rate</span>
                     <span class="font-serif text-3xl">₱{{ formatPrice(currentPrice) }}</span>
                     <div v-if="childAddOnPrice > 0" class="mt-1">
                        <span class="text-xs opacity-80">Base: ₱{{ formatPrice(baseRoomPrice) }} + Child: ₱{{ formatPrice(childAddOnPrice) }}</span>
                     </div>
                  </div>
                  <div class="text-right">
                     <span class="block text-xs uppercase tracking-wider opacity-70">Duration</span>
                     <span class="font-bold text-xl">{{ form.duration.replace('h', ' Hours') }}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div class="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center bg-white">
         
         <div class="mb-8">
            <h1 class="font-serif text-2xl text-balai-dark">Configure Your Stay</h1>
            <p class="text-gray-500 text-sm mt-1">Select your arrival time and duration.</p>
         </div>

         <form @submit.prevent="proceedToBooking" class="space-y-8">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="flex flex-col">
                  <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Check-in Date</label>
                  <input v-model="form.date" type="date" required class="w-full border-b border-gray-300 py-3 text-balai-dark focus:outline-none focus:border-balai-gold transition-colors bg-transparent" />
               </div>
               <div class="flex flex-col">
                  <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Arrival Time</label>
                  <input v-model="form.time" type="time" step="300" required class="w-full border-b border-gray-300 py-3 text-balai-dark focus:outline-none focus:border-balai-gold transition-colors bg-transparent" />
                  <span class="text-xs text-gray-400 mt-1">Time must be in 5-minute increments</span>
               </div>
            </div>

            <div>
               <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 block">Select Package</label>
               <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label v-for="(price, key) in room.rates" :key="key" 
                     class="cursor-pointer border p-3 text-center transition-all hover:border-balai-gold"
                     :class="form.duration === key ? 'bg-balai-dark text-white border-balai-dark' : 'border-gray-200 text-gray-600'"
                  >
                     <input type="radio" v-model="form.duration" :value="key" class="hidden">
                     <span class="block font-bold uppercase text-xs tracking-wider mb-1">{{ key }}</span>
                     <span class="block text-sm">₱{{ formatPrice(price) }}</span>
                  </label>
               </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
               <div class="flex flex-col">
                  <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Adults</label>
                  <select v-model="form.adults" class="w-full border-b border-gray-300 py-3 text-balai-dark focus:outline-none focus:border-balai-gold bg-transparent">
                     <option v-for="n in maxAdults" :key="n" :value="n">{{ n }} Adult{{ n > 1 ? 's' : '' }}</option>
                  </select>
               </div>

               <div class="flex flex-col">
                  <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Children (0-13 years)</label>
                  <div class="flex items-center gap-3">
                     <button 
                        type="button"
                        @click="decrementChildren"
                        :disabled="form.children === 0"
                        class="w-10 h-10 border border-gray-300 hover:border-balai-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                     >
                        <span class="text-lg">−</span>
                     </button>
                     <span class="text-lg font-bold text-balai-dark min-w-[3rem] text-center">{{ form.children }}</span>
                     <button 
                        type="button"
                        @click="incrementChildren"
                        :disabled="form.children === 2"
                        class="w-10 h-10 border border-gray-300 hover:border-balai-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                     >
                        <span class="text-lg">+</span>
                     </button>
                     <span class="text-xs text-gray-400 ml-2">Max 2 children</span>
                  </div>
               </div>
            </div>

            <!-- Child Age Dropdowns (shown only if children > 0) -->
            <div v-if="form.children > 0" class="border border-balai-gold/20 bg-amber-50/30 p-4 rounded">
               <label class="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3 block">Child Ages</label>
               <p class="text-xs text-gray-500 mb-3">Ages 0-6: Free | Ages 7-13: +₱150 per child</p>
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="(age, index) in form.childAges" :key="index" class="flex flex-col">
                     <label class="text-xs text-gray-500 mb-1">Child {{ index + 1 }} Age</label>
                     <select 
                        v-model="form.childAges[index]" 
                        class="w-full border-b border-gray-300 py-2 text-balai-dark focus:outline-none focus:border-balai-gold bg-transparent"
                     >
                        <option v-for="n in 14" :key="n-1" :value="n-1">{{ n-1 }} years old</option>
                     </select>
                  </div>
               </div>
               <div v-if="childAddOnPrice > 0" class="mt-3 pt-3 border-t border-amber-200">
                  <p class="text-sm text-amber-800 font-medium">
                     Child Surcharge: +₱{{ formatPrice(childAddOnPrice) }}
                  </p>
               </div>
            </div>

            <div class="border-t border-gray-100 pt-6">
               <div v-if="availabilityResult" class="mb-6">
                  <div v-if="availabilityResult.available" class="bg-green-50 border border-green-200 p-4">
                     <p class="text-green-800 font-bold mb-2 text-center flex items-center justify-center gap-2">
                       <CheckCircleIcon class="w-5 h-5" /> Rooms Available!
                     </p>
                     <p class="text-green-700 text-sm mb-3 text-center">
                        {{ availableRoomsCount }} {{ room.name }}{{ availableRoomsCount > 1 ? 's are' : ' is' }} available for your selected time.
                     </p>
                     
                     <div v-if="!selectedRoomId" class="bg-white border border-green-300 rounded p-3 mb-3">
                        <p class="text-green-700 text-sm text-center">
                           <span class="font-bold">Quick Booking:</span> We'll assign you the best available room automatically.
                        </p>
                     </div>
                     
                     <div v-else class="bg-white border border-green-500 rounded p-3 mb-3">
                        <p class="text-green-800 text-sm text-center font-bold flex items-center justify-center gap-2">
                           <CheckIcon class="w-4 h-4" /> You selected: Room {{ availableRoomsList.find(r => r.id === selectedRoomId)?.number }}
                        </p>
                     </div>
                     
                     <button 
                        v-if="availableRoomsCount > 1"
                        type="button"
                        @click="toggleRoomPicker"
                        class="w-full text-sm text-green-700 hover:text-green-900 underline mb-3 transition-colors"
                     >
                        {{ showRoomPicker ? '▲ Hide room selection' : '▼ I want to choose a specific room' }}
                     </button>
                     
                     <div v-if="showRoomPicker && availableRoomsCount > 1" class="mt-3 bg-white border border-green-300 rounded p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-green-800 mb-3 text-center">
                           Pick Your Room
                        </p>
                        
                        <div class="grid grid-cols-4 gap-2 mb-3">
                           <button
                              v-for="availRoom in paginatedRooms"
                              :key="availRoom.id"
                              type="button"
                              @click="selectRoom(availRoom.id)"
                              class="px-3 py-4 border-2 rounded text-center transition-all hover:border-green-500 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                              :class="selectedRoomId === availRoom.id 
                                 ? 'bg-green-600 text-white border-green-600 font-bold' 
                                 : 'bg-white text-gray-700 border-gray-300'"
                           >
                              <div class="text-sm font-bold">{{ availRoom.number }}</div>
                              <div class="text-xs opacity-75 mt-1 flex items-center justify-center gap-1">
                                 <CheckIcon v-if="selectedRoomId === availRoom.id" class="w-3 h-3" />
                                 <span>{{ selectedRoomId === availRoom.id ? 'Selected' : 'Available' }}</span>
                              </div>
                           </button>
                        </div>
                        
                        <div v-if="totalPages > 1" class="flex items-center justify-between pt-3 border-t border-gray-200">
                           <button
                              type="button"
                              @click="previousPage"
                              :disabled="!canGoPrevious"
                              class="px-4 py-2 text-xs font-medium text-green-700 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           >
                              ← Previous
                           </button>
                           
                           <span class="text-xs text-gray-600">
                              Page {{ currentPage + 1 }} of {{ totalPages }}
                           </span>
                           
                           <button
                              type="button"
                              @click="nextPage"
                              :disabled="!canGoNext"
                              class="px-4 py-2 text-xs font-medium text-green-700 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           >
                              Next →
                           </button>
                        </div>
                        
                        <button
                           v-if="selectedRoomId"
                           type="button"
                           @click="selectedRoomId = null"
                           class="w-full mt-3 text-xs text-gray-600 hover:text-gray-800 underline"
                        >
                           Clear selection (use auto-assign)
                        </button>
                     </div>
                     
                     <button 
                        type="button" 
                        @click="availabilityResult = null; availableRoomsCount = 0; availableRoomsList = []; selectedRoomId = null; showRoomPicker = false"
                        class="w-full text-xs text-green-600 hover:text-green-800 mt-3 underline"
                     >
                        Check different time
                     </button>
                  </div>

                  <div v-else class="bg-red-50 border border-red-200 p-4 text-center">
                     <p class="text-red-800 font-bold mb-2">✗ No Rooms Available</p>
                     <p class="text-red-700 text-sm">{{ availabilityResult.message }}</p>
                     <button 
                        type="button" 
                        @click="availabilityResult = null; availableRoomsCount = 0; availableRoomsList = []; selectedRoomId = null; showRoomPicker = false"
                        class="text-xs text-red-600 hover:text-red-800 mt-2 underline"
                     >
                        Try different time
                     </button>
                  </div>
               </div>
            </div>

            <div class="pt-6 flex items-center justify-between gap-6">
               <button type="button" @click="router.push('/rooms')" class="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-balai-dark">
                  Back
               </button>
               
               <button 
                  v-if="!availabilityResult"
                  type="button" 
                  @click="checkAvailability"
                  :disabled="checkingAvailability"
                  class="bg-balai-gold text-white px-12 py-4 text-sm font-medium uppercase tracking-widest hover:bg-balai-dark transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {{ checkingAvailability ? 'Checking Availability...' : 'Check Availability' }}
               </button>
               
               <button 
                  v-else-if="availabilityResult.available"
                  type="submit"
                  class="bg-balai-dark text-white px-12 py-4 text-sm font-medium uppercase tracking-widest hover:bg-balai-gold transition-colors shadow-lg"
               >
                  {{ selectedRoomId ? 'Book Selected Room' : 'Book Now (Auto-Assign)' }}
               </button>
            </div>

         </form>
      </div>

    </div>
  </main>
</template>