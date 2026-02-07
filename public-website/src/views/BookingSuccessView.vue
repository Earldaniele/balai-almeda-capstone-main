<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const booking = ref(null)

onMounted(async () => {
  // 1. Get reference code from URL
  const referenceCode = route.query.reference

  if (!referenceCode) {
    error.value = 'No booking reference found'
    loading.value = false
    setTimeout(() => router.push('/rooms'), 3000)
    return
  }

  // 2. Verify payment (backend will use session_id from database)
  try {
    const response = await fetch(`http://localhost:3000/api/payment/verify/${referenceCode}`)
    const data = await response.json()

    if (data.success) {
      // ✅ DEFENSIVE CODING: Validate booking object structure
      if (!data.booking || typeof data.booking !== 'object') {
        error.value = 'Invalid booking data received from server'
        setTimeout(() => router.push('/rooms'), 3000)
        return
      }

      // ✅ FIXED: Backend returns camelCase properties
      booking.value = {
        referenceCode: data.booking.referenceCode ?? 'N/A',
        guestName: data.booking.guestName ?? 'Guest',
        email: data.booking.email ?? 'N/A',
        phone: data.booking.phone ?? 'N/A',
        checkInTime: data.booking.checkInTime ?? null,
        checkOutTime: data.booking.checkOutTime ?? null,
        totalAmount: data.booking.totalAmount ?? 0,
        durationHours: data.booking.durationHours ?? 0,
        status: data.booking.status ?? 'Pending',
        roomId: data.booking.roomId ?? null,
        roomName: data.booking.roomName ?? 'Unknown Room'
      }
      
      // If status is pending, show appropriate message
      if (data.status === 'pending') {
        // Payment processing
      }
    } else {
      error.value = 'Booking not found or payment not confirmed'
      setTimeout(() => router.push('/rooms'), 3000)
    }
  } catch (err) {
    error.value = 'Failed to verify booking'
    setTimeout(() => router.push('/rooms'), 3000)
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  }).format(date)
}

const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', minute: 'numeric', hour12: true 
  }).format(date)
}

const formatPrice = (price) => {
  if (!price || isNaN(price)) return '0.00'
  return parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const goToMyBookings = () => {
  router.push('/my-bookings') // Changed from '/bookings' to match your router path if needed
}

const goToHome = () => {
  router.push('/')
}
</script>

<template>
  <main class="min-h-screen bg-gray-50 font-sans text-balai-dark pt-32 pb-20 px-6">
    
    <div v-if="loading" class="container mx-auto max-w-xl text-center pt-10">
      <div class="bg-white p-12 shadow-sm border border-gray-100">
        <div class="animate-spin h-10 w-10 border-2 border-gray-100 border-t-balai-gold mx-auto mb-6"></div>
        <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Verifying Payment...</p>
      </div>
    </div>

    <div v-else-if="error" class="container mx-auto max-w-xl text-center pt-10">
      <div class="bg-white p-12 shadow-sm border border-gray-100">
        <div class="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto mb-6">✕</div>
        <h2 class="font-serif text-2xl mb-4 text-red-600">Verification Failed</h2>
        <p class="text-gray-600 mb-8 text-sm leading-relaxed">{{ error }}</p>
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Redirecting...</p>
      </div>
    </div>

    <div v-else-if="booking" class="container mx-auto max-w-4xl">
      
      <div class="text-center mb-12">
        <div class="w-20 h-20 rounded-full bg-balai-dark text-white flex items-center justify-center mx-auto mb-8 shadow-lg">
          <CheckCircleIcon class="w-12 h-12" />
        </div>
        <h1 class="font-serif text-3xl md:text-5xl mb-4 text-balai-dark">
          {{ booking.status === 'Confirmed' ? 'Booking Confirmed' : 'Payment Received' }}
        </h1>
        <p class="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
          {{ booking.status === 'Confirmed' ? 'Your stay is secured' : 'Processing your reservation' }}
        </p>
        
        <p v-if="booking.status === 'Pending_Payment'" class="text-yellow-600 text-xs mt-4 bg-yellow-50 inline-block px-4 py-2 border border-yellow-200">
          We are finalizing your payment details.
        </p>
      </div>

      <div class="bg-white shadow-xl shadow-gray-200/50 border border-gray-100">
        
        <div class="bg-balai-dark text-white p-8 md:p-10 text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1 bg-balai-gold opacity-50"></div>
          
          <p class="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">Reference Code</p>
          <h2 class="font-serif text-4xl md:text-5xl tracking-wide">{{ booking.referenceCode }}</h2>
        </div>

        <div class="p-8 md:p-12">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 pb-12 border-b border-gray-100">
            <div>
               <h3 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Accommodation</h3>
               <p class="font-serif text-2xl md:text-3xl mb-1">{{ booking.roomName }}</p>
               <p class="text-sm text-gray-500">{{ booking.durationHours }} Hour Duration</p>
            </div>
            
            <div class="flex flex-col justify-end">
               <div class="flex justify-between items-end mb-1">
                 <span class="text-sm text-gray-500">Amount Paid</span>
                 <span class="font-serif text-2xl text-balai-dark">₱{{ formatPrice(booking.totalAmount) }}</span>
               </div>
               <div class="text-right">
                 <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-green-50 text-green-700">
                   {{ booking.status }}
                 </span>
               </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div class="bg-gray-50 p-6 border border-gray-100">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Check-In</h4>
              <p class="font-serif text-xl mb-1">{{ formatDate(booking.checkInTime) }}</p>
              <p class="text-sm text-balai-gold font-medium">{{ formatTime(booking.checkInTime) }}</p>
            </div>
            
            <div class="bg-gray-50 p-6 border border-gray-100">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Check-Out</h4>
              <p class="font-serif text-xl mb-1">{{ formatDate(booking.checkOutTime) }}</p>
              <p class="text-sm text-balai-gold font-medium">{{ formatTime(booking.checkOutTime) }}</p>
            </div>
          </div>

          <div class="bg-white border border-gray-200 p-8 mb-10">
            <h4 class="font-serif text-lg mb-4 flex items-center gap-2">
              <span class="text-balai-gold">✦</span> Guest Reminders
            </h4>
            <ul class="text-sm text-gray-600 space-y-3 pl-1">
              <li class="flex gap-3">
                <span class="text-balai-gold font-bold">01</span>
                <span>A confirmation email has been sent to your inbox.</span>
              </li>
              <li class="flex gap-3">
                <span class="text-balai-gold font-bold">02</span>
                <span>Please present your reference code <b>{{ booking.referenceCode }}</b> upon arrival.</span>
              </li>
              <li class="flex gap-3">
                <span class="text-balai-gold font-bold">03</span>
                <span>Standard check-in requires a valid government ID.</span>
              </li>
            </ul>
          </div>

          <div class="flex flex-col md:flex-row gap-4">
            <button 
              @click="goToMyBookings"
              class="flex-1 bg-balai-dark text-white py-4 px-6 text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors"
            >
              View My Bookings
            </button>
            <button 
              @click="goToHome"
              class="flex-1 bg-white border border-gray-200 text-balai-dark py-4 px-6 text-xs font-bold uppercase tracking-widest hover:border-balai-dark transition-colors"
            >
              Return Home
            </button>
          </div>

        </div>
      </div>

      <div class="text-center mt-12 mb-8">
        <p class="text-sm text-gray-500 font-serif italic">"We look forward to welcoming you home."</p>
      </div>

    </div>
  </main>
</template>