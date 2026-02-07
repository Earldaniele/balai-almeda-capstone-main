<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'
import LoginRequiredModal from '@/components/modals/LoginRequiredModal.vue'
import { CheckIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()
const room = ref(null)
const loading = ref(true)
const error = ref(null)
const showLoginModal = ref(false)

// Fetch room details from backend
const fetchRoomDetails = async (slug) => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch(`http://localhost:3000/api/rooms/${slug}`)
    const data = await response.json()
    
    if (data.success) {
      // ✅ DEFENSIVE CODING: Validate room object structure
      if (!data.room || typeof data.room !== 'object') {
        console.warn('⚠️ API Response Validation Failed: Expected room object, got:', typeof data.room)
        error.value = 'Invalid room data received from server'
        return
      }

      // Map with safe property access and validation
      room.value = {
        id: data.room.id ?? 'unknown',
        name: data.room.name ?? 'Unnamed Room',
        capacity: data.room.capacity ?? 'N/A',
        size: data.room.size ?? 'N/A',
        description: data.room.description ?? 'No description available',
        image: data.room.image ?? 'bg-gray-300',
        rates: {
          '3h': data.room.rates?.['3h'] ?? 0,
          '6h': data.room.rates?.['6h'] ?? 0,
          '12h': data.room.rates?.['12h'] ?? 0,
          '24h': data.room.rates?.['24h'] ?? 0
        },
        amenities: Array.isArray(data.room.amenities) ? data.room.amenities : [],
        images: data.room.images ?? []
      }
    } else {
      error.value = 'Room not found'
    }
  } catch (err) {
    console.error('Error fetching room details:', err)
    error.value = 'Network error. Please try again later.'
  } finally {
    loading.value = false
  }
}

const formatPrice = (price) => price ? price.toLocaleString() : '0'

// Computed: Primary image (the one with isPrimary = true)
const primaryImage = computed(() => {
  if (!room.value || !room.value.images || room.value.images.length === 0) return null
  return room.value.images.find(img => img.isPrimary)
})

// Computed: Gallery images (non-primary images, sorted by displayOrder)
const galleryImages = computed(() => {
  if (!room.value || !room.value.images || room.value.images.length === 0) return []
  return room.value.images
    .filter(img => !img.isPrimary)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .slice(0, 3) // Max 3 for the grid
})

// Handle book now click
const handleBookNow = (roomId) => {
  if (!isAuthenticated()) {
    showLoginModal.value = true
  } else {
    router.push({ path: '/availability', query: { id: roomId } })
  }
}

// Watch for route changes
watch(() => route.query.id, (newId) => {
  if (newId) {
    fetchRoomDetails(newId)
  }
}, { immediate: true })

onMounted(() => {
  const roomId = route.query.id || 'standard'
  fetchRoomDetails(roomId)
})
</script>

<template>
  <main class="min-h-screen bg-balai-bg font-sans text-balai-dark pt-24 pb-20 px-4 md:px-6">

    <!-- Loading State -->
    <div v-if="loading" class="container mx-auto max-w-6xl text-center py-20">
      <p class="text-gray-600">Loading room details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto max-w-6xl text-center py-20">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <RouterLink to="/rooms" class="text-sm font-bold uppercase tracking-widest text-balai-gold hover:text-balai-dark">
        Back to Rooms
      </RouterLink>
    </div>

    <!-- Room Details -->
    <div v-else-if="room" class="container mx-auto max-w-6xl">
      
      <div class="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">
        <RouterLink to="/" class="hover:text-balai-gold">Home</RouterLink>
        <span class="mx-2">/</span>
        <RouterLink to="/rooms" class="hover:text-balai-gold">Rooms</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-balai-gold-dark">{{ room.name }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 h-[50vh] mb-12">
        <!-- Hero Image (Primary) -->
        <div class="md:col-span-2 h-full bg-gray-300 relative overflow-hidden group">
           <img 
             v-if="primaryImage" 
             :src="primaryImage.path" 
             :alt="primaryImage.altText || room.name"
             class="absolute inset-0 w-full h-full object-cover" 
           />
           <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
        </div>
        <!-- Gallery Grid (Non-primary images) -->
        <div class="md:col-span-2 grid grid-cols-2 gap-4 h-full">
           <div 
             v-for="(img, index) in galleryImages.slice(0, 2)" 
             :key="img.id" 
             class="bg-gray-300 h-full relative overflow-hidden"
           >
             <img 
               :src="img.path" 
               :alt="img.altText || room.name"
               class="absolute inset-0 w-full h-full object-cover" 
             />
           </div>
           <div 
             v-if="galleryImages[2]" 
             class="bg-gray-300 h-full relative overflow-hidden"
           >
             <img 
               :src="galleryImages[2].path" 
               :alt="galleryImages[2].altText || room.name"
               class="absolute inset-0 w-full h-full object-cover" 
             />
           </div>
           <div 
             v-else 
             class="bg-gray-300 h-full"
           ></div>
           <div class="bg-gray-300 h-full relative flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors">
              <span class="font-serif text-white text-lg underline">View All Photos</span>
           </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <div class="lg:col-span-2 space-y-12">
           <div>
              <h1 class="font-serif text-4xl md:text-5xl mb-4 text-balai-dark">{{ room.name }}</h1>
              
              <p class="text-xl text-balai-gold-dark font-serif mb-6">
                Starts at ₱{{ formatPrice(room.rates['3h']) }} <span class="text-sm font-sans text-gray-500">/ 3hrs</span>
              </p>
              
              <p class="text-gray-600 leading-relaxed text-lg">
                 {{ room.description }}
              </p>
           </div>

           <div class="border-t border-gray-200 pt-8">
              <h3 class="font-serif text-2xl mb-6">Room Amenities</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                 <div v-for="amenity in room.amenities" :key="amenity" class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-600" /> {{ amenity }}
                 </div>
              </div>
           </div>
        </div>

        <div class="lg:col-span-1">
           <div class="bg-white p-8 shadow-xl border-t-4 border-balai-gold sticky top-24">
              <h3 class="font-serif text-2xl mb-6">Reserve this Stay</h3>
              
              <div class="space-y-4 mb-8">
                 <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span class="text-gray-500">Capacity</span>
                    <span class="font-bold">{{ room.capacity }}</span>
                 </div>
                 <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span class="text-gray-500">Size</span>
                    <span class="font-bold">{{ room.size }}</span>
                 </div>
                 </div>

              <div class="bg-gray-50 p-4 rounded mb-8">
                 <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Available Rates</p>
                 <div class="space-y-2 text-sm">
                    <div class="flex justify-between items-center">
                       <span class="text-gray-600">3 Hours</span>
                       <span class="font-bold text-balai-dark">₱{{ formatPrice(room.rates['3h']) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                       <span class="text-gray-600">6 Hours</span>
                       <span class="font-bold text-balai-dark">₱{{ formatPrice(room.rates['6h']) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                       <span class="text-gray-600">12 Hours</span>
                       <span class="font-bold text-balai-dark">₱{{ formatPrice(room.rates['12h']) }}</span>
                    </div>
                    <div class="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                       <span class="text-gray-600">24 Hours</span>
                       <span class="font-bold text-balai-gold-dark">₱{{ formatPrice(room.rates['24h']) }}</span>
                    </div>
                 </div>
              </div>

              <button 
                 @click="handleBookNow(room.id)"
                 class="block w-full bg-balai-dark text-white text-center py-4 text-sm font-medium uppercase tracking-widest hover:bg-balai-gold transition-colors"
              >
                 Proceed to Book
              </button>
              
              <p class="text-xs text-center text-gray-400 mt-4">Select duration at checkout</p>
           </div>
        </div>

      </div>

    </div>

    <!-- Login Required Modal -->
    <LoginRequiredModal 
        :isOpen="showLoginModal" 
        @close="showLoginModal = false" 
    />
  </main>
</template>