<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'
import LoginRequiredModal from '@/components/modals/LoginRequiredModal.vue'
import api from '@/services/api'

const router = useRouter()
const rooms = ref([])
const loading = ref(true)
const error = ref(null)
const showLoginModal = ref(false)

// Fetch rooms from backend
const fetchRooms = async () => {
  try {
    loading.value = true
    const response = await api.get('/rooms')
    
    if (response.ok && response.data.success) {
      // ✅ DEFENSIVE CODING: Validate API response structure
      if (!Array.isArray(response.data?.rooms)) {
        console.warn('⚠️ API Response Validation Failed: Expected rooms array, got:', typeof response.data?.rooms)
        rooms.value = []
        error.value = 'Unexpected response format from server'
        return
      }

      // Map with safe property access and validation
      rooms.value = response.data.rooms
        .filter(room => room && typeof room === 'object') // Filter out null/invalid entries
        .map(room => ({
          id: room.id ?? 'unknown',
          name: room.name ?? 'Unnamed Room',
          capacity: room.capacity ?? 'N/A',
          size: room.size ?? 'N/A',
          description: room.description ?? 'No description available',
          image: room.image ?? 'bg-gray-300',
          images: room.images ?? [], // Add images array
          rates: {
            '3h': room.rates?.['3h'] ?? 0,
            '6h': room.rates?.['6h'] ?? 0,
            '12h': room.rates?.['12h'] ?? 0,
            '24h': room.rates?.['24h'] ?? 0
          }
        }))
    } else {
      error.value = 'Failed to load rooms'
    }
  } catch (err) {
    console.error('Error fetching rooms:', err)
    error.value = 'Network error. Please try again later.'
  } finally {
    loading.value = false
  }
}

// Get primary image for a room
const getPrimaryImage = (room) => {
  if (room.images && room.images.length > 0) {
    const primary = room.images.find(img => img.isPrimary)
    return primary ? primary.path : room.images[0].path
  }
  return null
}

// Helper to format numbers (e.g. 1,800)
const formatPrice = (price) => {
  return price ? price.toLocaleString() : '0'
}

// Handle book now click
const handleBookNow = (roomId) => {
  if (!isAuthenticated()) {
    showLoginModal.value = true
  } else {
    router.push({ path: '/availability', query: { id: roomId } })
  }
}

onMounted(() => {
  fetchRooms()
})
</script>

<template>
    <main class="bg-balai-bg text-balai-dark font-sans min-h-screen">

        <section class="relative h-[50vh] bg-balai-dark flex items-center justify-center text-white px-4">
            <div class="absolute inset-0 bg-black/40"></div>
            <div class="relative z-10 text-center max-w-3xl mx-auto">
                <h1 class="font-serif text-4xl md:text-5xl mb-4 tracking-wide">
                ACCOMMODATION
                </h1>
                <p class="text-sm md:text-lg uppercase tracking-widest opacity-90">
                Comfort in every corner
                </p>
            </div>
        </section>

        <section class="container mx-auto px-4 md:px-6 py-16 md:py-24">
            <div class="text-center max-w-2xl mx-auto mb-16 space-y-4">
                <h2 class="font-serif text-3xl text-balai-dark">Stay With Us</h2>
                <p class="text-gray-600 leading-relaxed">
                   Designed for the modern traveler's schedule. Whether you need a quick 3-hour recharge, a half-day workspace, or a full overnight rest, our rooms offer luxury that fits your timeline.
                </p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-20">
                <p class="text-gray-600">Loading rooms...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-20">
                <p class="text-red-600 mb-4">{{ error }}</p>
                <button @click="fetchRooms" class="text-sm font-bold uppercase tracking-widest text-balai-gold hover:text-balai-dark">
                    Try Again
                </button>
            </div>

            <!-- Rooms Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-10">

                <div 
                  v-for="room in rooms" 
                  :key="room.id" 
                  class="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                    <!-- Dynamic Image -->
                    <div class="aspect-[4/3] relative overflow-hidden bg-gray-300">
                        <img 
                            v-if="getPrimaryImage(room)" 
                            :src="getPrimaryImage(room)" 
                            :alt="room.name"
                            class="w-full h-full object-cover"
                        />
                        <div v-else :class="room.image" class="w-full h-full"></div>
                        <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <div class="p-8 md:p-10 space-y-6">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-serif text-2xl mb-1 text-balai-dark">{{ room.name }}</h3>
                                <span class="text-xs font-bold uppercase tracking-widest text-balai-gold-dark">
                                {{ room.capacity }} &bull; {{ room.size }}
                                </span>
                            </div>
                            <div class="text-right">
                                <span class="block text-xl font-serif">₱{{ formatPrice(room.rates['3h']) }}</span>
                                <span class="text-xs text-gray-500">starts at 3 hr</span>
                            </div>
                        </div>

                        <p class="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {{ room.description }}
                        </p>

                        <div class="pt-4 border-t border-gray-100 flex gap-4">
                            <button 
                                @click="handleBookNow(room.id)"
                                class="flex-1 bg-balai-dark text-white py-4 text-xs font-medium uppercase tracking-widest hover:bg-balai-gold transition-colors text-center"
                            >
                                Book Now
                            </button>
                            
                            <RouterLink 
                               :to="{ path: '/rooms/details', query: { id: room.id } }" 
                               class="px-6 border border-balai-dark text-balai-dark py-4 text-xs font-medium uppercase tracking-widest hover:bg-gray-50 hover:text-balai-gold hover:border-balai-gold transition-colors text-center block"
                            >
                                Details
                            </RouterLink>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        <!-- Login Required Modal -->
        <LoginRequiredModal 
            :isOpen="showLoginModal" 
            @close="showLoginModal = false" 
        />
    </main>
</template>