<template>
  <div class="min-h-screen bg-gray-50 pt-28 pb-12 px-6 font-sans text-balai-dark">
    <div class="max-w-5xl mx-auto">
      
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-serif mb-2">My Bookings</h1>
          <p class="text-gray-500 text-sm tracking-wide">Manage your upcoming stays and view history.</p>
        </div>
        
        <div class="flex bg-white p-1 shadow-sm border border-gray-100 w-full md:w-auto">
          <button 
            @click="activeTab = 'upcoming'"
            :class="[
              'flex-1 md:flex-none px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all',
              activeTab === 'upcoming' 
                ? 'bg-balai-dark text-white shadow-sm' 
                : 'text-gray-400 hover:text-balai-dark'
            ]"
          >
            Upcoming
          </button>
          <button 
            @click="activeTab = 'history'"
            :class="[
              'flex-1 md:flex-none px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all',
              activeTab === 'history' 
                ? 'bg-balai-dark text-white shadow-sm' 
                : 'text-gray-400 hover:text-balai-dark'
            ]"
          >
            History
          </button>
        </div>
      </div>
      
      <div class="bg-white shadow-lg shadow-gray-200/50 min-h-[400px] border border-gray-100 relative">
        
        <!-- Loading State -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-block w-12 h-12 border-4 border-gray-200 border-t-balai-dark rounded-full animate-spin mb-4"></div>
            <p class="text-gray-500 text-sm">Loading your bookings...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <div class="w-20 h-20 bg-red-50 flex items-center justify-center mb-6">
            <ExclamationTriangleIcon class="w-12 h-12 text-red-500" />
          </div>
          <h3 class="font-serif text-2xl mb-3">Unable to Load Bookings</h3>
          <p class="text-gray-500 max-w-md mb-8">{{ error }}</p>
          <button 
            @click="fetchBookings"
            class="px-8 py-4 bg-balai-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Authenticated User Content -->
        <div v-else-if="isAuthenticated()">
          
          <!-- Empty State -->
          <div v-if="displayedBookings.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div class="w-20 h-20 flex items-center justify-center mb-6">
              <CalendarIcon class="w-12 h-12 text-gray-400" />
            </div>
            
            <h3 class="font-serif text-2xl mb-3">
              {{ activeTab === 'upcoming' ? 'No Upcoming Stays' : 'No Booking History' }}
            </h3>
            <p class="text-gray-500 max-w-md mb-8 leading-relaxed">
              {{ activeTab === 'upcoming' 
                ? "You haven't booked a room with us yet. Experience the serenity of Balai Almeda today." 
                : "You don't have any past bookings yet." 
              }}
            </p>
            
            <div v-if="activeTab === 'upcoming'" class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <RouterLink 
                to="/availability" 
                class="px-8 py-4 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-balai-dark hover:text-balai-dark transition-colors"
              >
                Check Availability
              </RouterLink>
              
              <RouterLink 
                to="/booking" 
                class="px-8 py-4 bg-balai-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors shadow-lg shadow-gray-200"
              >
                Book a Room
              </RouterLink>
            </div>
          </div>

          <!-- Bookings List -->
          <div v-else class="p-6 space-y-4">
            <div 
              v-for="booking in displayedBookings" 
              :key="booking.id"
              class="border border-gray-200 hover:border-neutral-400 transition-all duration-200 bg-white"
            >
              <div class="p-6">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div class="flex-1">
                    <div class="flex items-start gap-3 mb-3">
                      <h3 class="font-serif text-xl">{{ booking.roomName || 'Room' }}</h3>
                      <span 
                        :class="[
                          'px-3 py-1 text-xs font-bold uppercase tracking-wider',
                          getStatusClass(booking.status)
                        ]"
                      >
                        {{ booking.status }}
                      </span>
                    </div>
                    <p class="text-gray-500 text-sm mb-2">{{ booking.roomType }}</p>
                    <p class="text-xs text-gray-400 tracking-wide">
                      Reference: <span class="font-mono">{{ booking.referenceCode }}</span>
                    </p>
                  </div>
                  
                  <div class="text-right">
                    <p class="font-serif text-2xl text-balai-dark mb-1">
                      {{ formatCurrency(booking.totalAmount) }}
                    </p>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      {{ booking.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment' }}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                    <p class="font-medium">{{ formatDate(booking.checkInTime) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
                    <p class="font-medium">{{ formatDate(booking.checkOutTime) }}</p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="mt-6 flex gap-3">
                  <RouterLink 
                    :to="`/booking-success?reference=${booking.referenceCode}`"
                    class="px-6 py-2 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-balai-dark hover:text-balai-dark transition-colors"
                  >
                    View Details
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Not Authenticated -->
        <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <p class="text-gray-500 mb-6">Please log in to access your dashboard.</p>
          <RouterLink 
            to="/login" 
            class="px-8 py-3 bg-balai-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors"
          >
            Log In
          </RouterLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { isAuthenticated, getToken } from '@/utils/auth'
import api from '@/services/api'
import { toast } from 'vue-sonner'
import { ExclamationTriangleIcon, CalendarIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const bookings = ref([])
const loading = ref(false)
const error = ref(null)
const activeTab = ref('upcoming') // 'upcoming' or 'history'

// Computed properties for filtering bookings
const upcomingBookings = computed(() => {
  const now = new Date()
  return bookings.value.filter(booking => {
    if (!booking.checkOutTime) return false
    const checkOutDate = new Date(booking.checkOutTime)
    if (isNaN(checkOutDate.getTime())) return false
    return checkOutDate >= now && booking.status !== 'Cancelled'
  })
})

const historyBookings = computed(() => {
  const now = new Date()
  return bookings.value.filter(booking => {
    if (!booking.checkOutTime) return true // Show in history if no date
    const checkOutDate = new Date(booking.checkOutTime)
    if (isNaN(checkOutDate.getTime())) return true
    return checkOutDate < now || booking.status === 'Cancelled' || booking.status === 'Completed'
  })
})

const displayedBookings = computed(() => {
  return activeTab.value === 'upcoming' ? upcomingBookings.value : historyBookings.value
})

// Fetch user bookings with proper authentication
const fetchBookings = async () => {
  loading.value = true
  error.value = null
  
  try {
    const token = getToken()
    
    if (!token) {
      toast.error('Please log in to view your bookings')
      router.push('/login')
      return
    }

    // ✅ FIXED: Use correct endpoint - /payment/my-bookings (Authorization header added automatically by api interceptor)
    const response = await api.get('/payment/my-bookings')
    
    if (response.ok && response.data.success) {
      // ✅ DEFENSIVE CODING: Validate bookings array structure
      if (!Array.isArray(response.data?.bookings)) {
        bookings.value = []
        error.value = 'Invalid response format from server'
        toast.error('Unable to load bookings - Invalid data format')
        return
      }

      // Map API response to component data structure (Backend uses camelCase)
      bookings.value = response.data.bookings
        .filter(booking => booking && typeof booking === 'object')
        .map(booking => ({
          id: booking.bookingId ?? booking.id ?? 'unknown',
          referenceCode: booking.referenceCode ?? 'N/A',
          guestName: booking.guestName ?? 'Guest',
          email: booking.email ?? 'N/A',
          phone: booking.phone ?? 'N/A',
          checkInTime: booking.checkInTime ?? null,
          checkOutTime: booking.checkOutTime ?? null,
          totalAmount: booking.totalAmount ?? 0,
          status: booking.status ?? 'Pending',
          paymentStatus: booking.paymentStatus ?? 'pending',
          roomId: booking.roomId ?? null,
          roomName: booking.roomName ?? 'Unknown Room',
          roomType: booking.roomType ?? 'Standard',
          createdAt: booking.createdAt ?? new Date().toISOString()
        }))

      // Show success message only if we have bookings
      if (bookings.value.length > 0) {
        toast.success(`Loaded ${bookings.value.length} booking${bookings.value.length > 1 ? 's' : ''}`)
      }
    } else {
      error.value = response.data?.message || 'Failed to load bookings'
      toast.error(error.value)
    }
  } catch (err) {
    error.value = 'Unable to load bookings. Please try again later.'
    toast.error('Failed to load bookings')
  } finally {
    loading.value = false
  }
}

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Format currency
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount)
}

// Get status badge class
const getStatusClass = (status) => {
  const statusLower = status?.toLowerCase()
  const statusMap = {
    'confirmed': 'bg-green-100 text-green-800',
    'pending_payment': 'bg-yellow-100 text-yellow-800',
    'pending payment': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800',
    'checked_in': 'bg-green-100 text-green-800',
    'checked in': 'bg-green-100 text-green-800'
  }
  return statusMap[statusLower] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
  } else {
    fetchBookings()
  }
})
</script>