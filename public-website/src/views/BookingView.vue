<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAuthenticated, getUser } from '@/utils/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

// Validate access - must be logged in and come from availability view
onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  
  const verified = route.query.verified
  if (!verified || verified !== 'true') {
    router.push('/rooms')
    return
  }
  
  const roomId = route.query.roomId
  if (!roomId) {
    router.push('/rooms')
    return
  }
  
  fetchRoomDetails()
  prefillUserData()
})

// Room data
const room = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchRoomDetails = async () => {
  try {
    const roomId = route.query.roomId
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
        }
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

// Pre-fill user data
const guestInfo = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const prefillUserData = () => {
  const user = getUser()
  if (user) {
    guestInfo.value.firstName = user.firstName || ''
    guestInfo.value.lastName = user.lastName || ''
    guestInfo.value.email = user.email || ''
    guestInfo.value.phone = user.phone || ''
  }
}

// Phone number validation regex for PH mobile numbers
const phoneRegex = /^(09|\+639|639)\d{9}$/

// Validate phone number format
const validatePhone = (phone) => {
  // Remove all spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, '')
  return phoneRegex.test(cleanPhone)
}

// --- 1. RETRIEVE DATA FROM URL ---
const query = route.query
const roomId = query.roomId
const selectedRoomId = query.selectedRoomId // Specific physical room selected by user
const dateParam = query.date // YYYY-MM-DD
const timeParam = query.time // HH:MM
const durationParam = query.duration || '3h' // '3h', '6h', etc.
const adults = parseInt(query.adults) || 1
const children = parseInt(query.children) || 0
const childAges = query.childAges ? (Array.isArray(query.childAges) ? query.childAges : [query.childAges]) : []
const hasChild = children > 0
const basePrice = Number(query.price) || 0

console.log('🔍 [BOOKING VIEW] URL Parameters:', {
  adults,
  children,
  childAges,
  hasChild,
  basePrice
})

// --- 2. CALCULATE DATES & TIMES ---
const checkInDate = computed(() => {
  if (!dateParam || !timeParam) return new Date()
  return new Date(`${dateParam}T${timeParam}`)
})

const checkOutDate = computed(() => {
  const hoursToAdd = parseInt(durationParam) // extracts 3 from '3h'
  return new Date(checkInDate.value.getTime() + (hoursToAdd * 60 * 60 * 1000))
})

// Helper for display formats
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  }).format(date)
}

const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', minute: 'numeric', hour12: true 
  }).format(date)
}

// --- 4. CALCULATE TOTALS ---
// Fee based on Child Policy (Ages 7-13 = 150 each, Ages 0-6 = Free)
let childFee = 0
if (children > 0 && childAges.length > 0) {
  childFee = childAges.filter(age => parseInt(age) >= 7 && parseInt(age) <= 13).length * 150
}
const totalDue = basePrice + childFee

console.log('💰 [BOOKING VIEW] Price Calculation:', {
  basePrice,
  childFee,
  totalDue,
  chargeableChildren: childAges.filter(age => parseInt(age) >= 7 && parseInt(age) <= 13).length
})

const formatPrice = (p) => p.toLocaleString()

// --- 3. PAYMENT HANDLER ---
const submitting = ref(false)
const paymentError = ref(null)

const handlePayment = async () => {
  submitting.value = true
  paymentError.value = null

  // Trim whitespace from guest info
  guestInfo.value.firstName = guestInfo.value.firstName.trim()
  guestInfo.value.lastName = guestInfo.value.lastName.trim()
  guestInfo.value.email = guestInfo.value.email.trim()
  guestInfo.value.phone = guestInfo.value.phone.trim()

  // Validate required fields
  if (!guestInfo.value.firstName || !guestInfo.value.lastName || !guestInfo.value.email || !guestInfo.value.phone) {
    paymentError.value = 'All guest information fields are required'
    submitting.value = false
    return
  }

  // Validate phone number
  if (!validatePhone(guestInfo.value.phone)) {
    paymentError.value = 'Please enter a valid PH mobile number (e.g., 0917... or +639...)'
    submitting.value = false
    return
  }

  try {
    // Get user data for guest_id
    const user = getUser()
    
    // Format phone number - remove +63 prefix if present (PayMongo adds it automatically)
    let formattedPhone = guestInfo.value.phone.replace(/\s+/g, '') // Remove spaces
    if (formattedPhone.startsWith('+63')) {
      formattedPhone = formattedPhone.substring(3) // Remove +63
    } else if (formattedPhone.startsWith('63')) {
      formattedPhone = formattedPhone.substring(2) // Remove 63
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1) // Remove leading 0
    }
    
    // Prepare payload for PayMongo checkout
    const payload = {
      roomSlug: roomId,
      checkInDate: dateParam,
      checkInTime: timeParam,
      duration: durationParam.replace('h', ''), // Convert '3h' to '3'
      totalAmount: totalDue.toString(),
      guestInfo: {
        guestId: user?.id?.toString() || null,
        email: guestInfo.value.email,
        firstName: guestInfo.value.firstName,
        lastName: guestInfo.value.lastName,
        phone: formattedPhone,
        // 🔥 CRITICAL FIX: Include child data from URL query params
        adults: adults,
        children: children,
        childAges: childAges
      }
    }
    
    console.log('📤 [BOOKING VIEW] Sending Payload to Backend:', JSON.stringify(payload, null, 2))
    
    // If user manually selected a specific room, include it
    if (selectedRoomId) {
      payload.roomId = selectedRoomId // Use roomId for manual selection
    }

    console.log('Creating checkout session with payload:', payload)

    // Call backend to create PayMongo checkout session
    const response = await api.post('/payment/create-checkout', payload)

    if (response.ok && response.data.success) {
      console.log('Checkout session created:', response.data.referenceCode)
      console.log('✅ Session ID saved to database by backend')
      
      // Redirect to PayMongo checkout page
      window.location.href = response.data.checkoutUrl
    } else {
      // Handle error
      paymentError.value = response.data.message || 'Failed to create checkout session'
      submitting.value = false
    }
  } catch (error) {
    console.error('Payment error:', error)
    paymentError.value = 'Unable to connect to payment gateway. Please try again.'
    submitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-balai-bg font-sans text-balai-dark pt-24 pb-20 px-4 md:px-6">

    <!-- Loading State -->
    <div v-if="loading" class="container mx-auto max-w-5xl text-center py-20">
      <p class="text-gray-600">Loading booking details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto max-w-5xl text-center py-20">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <p class="text-sm text-gray-500">Redirecting...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="room" class="container mx-auto max-w-5xl">
      
      <div class="mb-10 text-center">
         <h1 class="font-serif text-3xl md:text-4xl mb-2">Confirm Your Stay</h1>
         <p class="text-gray-500 text-sm uppercase tracking-widest">Almost there</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        
        <div class="lg:col-span-2">
           <div class="bg-white p-8 md:p-10 shadow-lg border-t-4 border-balai-gold">
              <h2 class="font-serif text-2xl mb-6">Guest Information</h2>
              
              <form @submit.prevent="handlePayment" class="space-y-6">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                       <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                       <input 
                          v-model="guestInfo.firstName"
                          type="text" 
                          required
                          maxlength="50" 
                          class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold" 
                          placeholder="Enter first name" 
                       />
                    </div>
                    <div class="flex flex-col">
                       <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                       <input 
                          v-model="guestInfo.lastName"
                          type="text" 
                          required
                          maxlength="50" 
                          class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold" 
                          placeholder="Enter last name" 
                       />
                    </div>
                 </div>

                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                       <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                       <input 
                          v-model="guestInfo.email"
                          type="email" 
                          required
                          maxlength="100" 
                          class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold" 
                          placeholder="name@example.com" 
                       />
                    </div>
                    <div class="flex flex-col">
                       <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                       <input 
                          v-model="guestInfo.phone"
                          type="tel" 
                          required
                          maxlength="13"
                          pattern="(09|\+639|639)\d{9}" 
                          class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold" 
                          placeholder="09171234567 or +639171234567" 
                       />
                       <p class="text-xs text-gray-400 mt-1">PH mobile number</p>
                    </div>
                 </div>

                 <!-- Error Message -->
                 <div v-if="paymentError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {{ paymentError }}
                 </div>

                 <button 
                    type="submit" 
                    :disabled="submitting"
                    class="w-full bg-balai-dark text-white py-4 text-sm font-medium uppercase tracking-widest hover:bg-balai-gold transition-colors shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <span v-if="!submitting">Proceed to Payment</span>
                    <span v-else>Processing...</span>
                 </button>
                 
                 <p class="text-xs text-gray-400 text-center mt-2">
                    You will be redirected to a secure payment gateway.
                 </p>

              </form>
           </div>
        </div>

        <div class="lg:col-span-1">
           <div class="bg-white p-8 shadow-xl sticky top-24">
              <h3 class="font-serif text-xl mb-6 pb-4 border-b border-gray-100">Booking Summary</h3>
              
              <div class="flex gap-4 mb-6">
                 <div :class="`w-20 h-20 ${room.image} shrink-0`"></div> 
                 <div>
                    <h4 class="font-bold text-balai-dark">{{ room.name }}</h4>
                    <p class="text-xs text-gray-500">
                       {{ adults }} Adult{{ adults > 1 ? 's' : '' }} 
                       <span v-if="children > 0">, {{ children }} Child{{ children > 1 ? 'ren' : '' }}</span>
                    </p>
                    <p v-if="children > 0 && childAges.length > 0" class="text-xs text-gray-400">
                       Ages: {{ childAges.join(', ') }}
                    </p>
                 </div>
              </div>

              <div class="space-y-4 text-sm mb-6">
                 <div class="flex justify-between items-start">
                    <span class="text-gray-500">Check-In</span>
                    <div class="text-right">
                        <span class="block font-bold">{{ formatDate(checkInDate) }}</span>
                        <span class="text-xs text-gray-400">{{ formatTime(checkInDate) }}</span>
                    </div>
                 </div>
                 <div class="flex justify-between items-start">
                    <span class="text-gray-500">Check-Out</span>
                    <div class="text-right">
                        <span class="block font-bold">{{ formatDate(checkOutDate) }}</span>
                        <span class="text-xs text-gray-400">{{ formatTime(checkOutDate) }}</span>
                    </div>
                 </div>
                 <div class="flex justify-between text-balai-gold-dark font-bold pt-2 border-t border-gray-50">
                    <span>Duration</span>
                    <span>{{ durationParam.replace('h', ' Hours') }}</span>
                 </div>
              </div>

              <div class="border-t border-gray-100 pt-4 space-y-2 mb-6">
                 <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Room Rate</span>
                    <span>₱{{ formatPrice(basePrice) }}</span>
                 </div>
                 
                 <div v-if="childFee > 0" class="flex justify-between text-sm">
                    <span class="text-gray-500">Child Fee ({{ childAges.filter(age => parseInt(age) >= 7 && parseInt(age) <= 13).length }} × ₱150)</span>
                    <span>₱{{ formatPrice(childFee) }}</span>
                 </div>

                 <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Service Fee</span>
                    <span>₱0</span>
                 </div>
              </div>

              <div class="border-t-2 border-balai-dark pt-4 flex justify-between items-end">
                 <span class="font-serif text-lg">Total</span>
                 <span class="font-serif text-2xl font-bold text-balai-gold-dark">₱{{ formatPrice(totalDue) }}</span>
              </div>

           </div>
        </div>

      </div>

    </div>
  </main>
</template>