<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { CakeIcon, FireIcon } from '@heroicons/vue/24/solid'

// --- 1. SMOOTH SCROLL FUNCTION ---
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// --- HERO SLIDESHOW ---
const heroImages = [
  '/images/rooms/BA1.png',
  '/images/rooms/BA2.png',
  '/images/rooms/BA3.png',
  '/images/rooms/BA4.png',
  '/images/rooms/BA5.png',
  '/images/rooms/BA6.png',
  '/images/rooms/BA7.png'
]

const currentSlide = ref(0)
let slideInterval = null

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % heroImages.length
}

const startSlideshow = () => {
  slideInterval = setInterval(nextSlide, 5000) // Change image every 5 seconds
}

const stopSlideshow = () => {
  if (slideInterval) {
    clearInterval(slideInterval)
  }
}

// --- 2. ROOM DATA PREPARATION ---
const rooms = ref([])
const isLoading = ref(true)
const error = ref(null)

// Fetch rooms from API
const fetchRooms = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await api.get('/rooms')
    
    if (response.ok && response.data.success) {
      // ✅ DEFENSIVE CODING: Validate API response structure
      if (!Array.isArray(response.data?.rooms)) {
        console.warn('⚠️ API Response Validation Failed: Expected rooms array, got:', typeof response.data?.rooms)
        rooms.value = []
        error.value = 'Unexpected response format from server'
        return
      }

      // Map the API data to a display-friendly format with safe property access
      rooms.value = response.data.rooms
        .filter(room => room && typeof room === 'object') // Filter out null/invalid entries
        .map(room => ({
          id: room.id ?? 'unknown',
          name: room.name ?? 'Unnamed Room',
          // Display the 3-hour rate as the "Starting At" price (with fallback)
          price: room.rates?.['3h'] ? `₱${room.rates['3h'].toLocaleString()}` : '₱0',
          duration: '3 hours',
          desc: room.description ?? 'No description available',
          slug: room.slug ?? 'unknown',
          images: room.images ?? [] // Add images array
        }))
      
      if (rooms.value.length === 0) {
        console.warn('⚠️ API returned empty rooms array')
      }
    } else {
      error.value = 'Failed to load rooms'
      console.error('Failed to fetch rooms:', response.data)
    }
  } catch (err) {
    error.value = 'Error loading rooms'
    console.error('Error fetching rooms:', err)
    rooms.value = [] // ✅ Ensure empty array on error
  } finally {
    isLoading.value = false
  }
}

// Fetch rooms on component mount
onMounted(() => {
  fetchRooms()
  startSlideshow()
})

onUnmounted(() => {
  stopSlideshow()
})

// --- 3. EXPAND/COLLAPSE LOGIC ---
const showAllRooms = ref(false)

// Default: Show the first 2 rooms. Expanded: Show all.
const visibleRooms = computed(() => {
  return showAllRooms.value ? rooms.value : rooms.value.slice(0, 2)
})

const toggleRooms = () => {
  if (showAllRooms.value) {
    // If we're showing all rooms and clicking "Show Less", scroll to the last visible room
    showAllRooms.value = false
    setTimeout(() => {
      const lastRoom = document.querySelector('[data-room-index="1"]')
      if (lastRoom) {
        lastRoom.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }, 100)
  } else {
    showAllRooms.value = true
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
</script>

<template>
  <main class="bg-balai-bg text-balai-dark font-sans overflow-x-hidden">

    <section class="relative h-[85vh] bg-balai-dark flex items-center justify-center text-white px-4 z-10">
      
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0">
          <TransitionGroup name="fade">
            <div
              v-for="(image, index) in heroImages"
              :key="index"
              v-show="currentSlide === index"
              class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              :style="{ backgroundImage: `url(${image})` }"
            ></div>
          </TransitionGroup>
        </div>
        
        <div class="absolute inset-0 bg-black/50"></div>
      </div>
      
      <div class="relative z-10 text-center max-w-3xl mx-auto">
        <h1 class="font-serif text-4xl md:text-6xl mb-4 tracking-wide leading-tight">
          A MODERN HOME IN PATEROS
        </h1>
        <p class="text-sm md:text-xl uppercase tracking-widest mb-8">
          SIMPLE. ORGANIC. COMFORTABLE.
        </p>
      </div>
      
      <div class="absolute bottom-32 md:bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        <button
          v-for="(image, index) in heroImages"
          :key="index"
          @click="currentSlide = index"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'"
          :aria-label="`Go to slide ${index + 1}`"
        ></button>
      </div>
      
      <div class="absolute bottom-12 md:bottom-0 md:translate-y-1/2 z-30 w-full text-center">
         <button 
           @click="scrollToSection('concept-section')"
           class="bg-balai-gold hover:bg-balai-gold-dark text-white px-8 py-4 font-medium text-sm tracking-wider transition-colors duration-300 shadow-lg inline-flex items-center gap-2"
         >
            EXPLORE OUR HOTEL <ChevronDownIcon class="w-4 h-4" />
         </button>
      </div>
    </section>
    
    <section id="concept-section" class="bg-white py-16 md:py-32 mt-0 relative z-0">
      <div class="container mx-auto px-6 space-y-16 md:space-y-24">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div class="space-y-6 order-2 md:order-1">
            <span class="font-serif text-xs uppercase tracking-widest block text-balai-gold-dark">Sanctuary</span>
            <h2 class="font-serif text-3xl md:text-4xl text-balai-dark leading-tight">
              A PAUSE BUTTON FOR THE CITY
            </h2>
            <p class="text-gray-600 leading-relaxed text-sm md:text-base">
              Located in the heart of San Roque, we offer a quiet, organic escape from the metro's noise. 
              Whether you are coming from a long flight or a long week, Balai Almeda is your space to breathe. 
              Minimalist design meets warm Filipino hospitality.
            </p>
          </div>
          
          <div class="aspect-square bg-gray-200 order-1 md:order-2 shadow-xl relative overflow-hidden">
             <div class="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-400 font-medium">
                [Insert Lobby/Interior Photo]
             </div>
          </div>
        </div>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
          
          <div class="aspect-[4/3] bg-gray-200 shadow-xl relative overflow-hidden">
             <div class="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-400 font-medium">
                [Insert Room/Relaxation Photo]
             </div>
          </div>
          
          <div class="space-y-6">
            <span class="font-serif text-xs uppercase tracking-widest block text-balai-gold-dark">Flexibility</span>
            <h2 class="font-serif text-3xl md:text-4xl text-balai-dark leading-tight">
              STAY ON YOUR TERMS
            </h2>
            <p class="text-gray-600 leading-relaxed text-sm md:text-base">
               Rest doesn't always follow a 24-hour schedule. We offer flexible stay options designed for the modern traveler.
            </p>
            <ul class="space-y-3 pt-2">
               <li class="flex items-center gap-3 text-sm font-medium text-balai-dark">
                  <span class="w-2 h-2 bg-balai-gold rounded-full"></span> 3-Hour Wash Up
               </li>
               <li class="flex items-center gap-3 text-sm font-medium text-balai-dark">
                  <span class="w-2 h-2 bg-balai-gold rounded-full"></span> 6-Hour Half Day
               </li>
               <li class="flex items-center gap-3 text-sm font-medium text-balai-dark">
                  <span class="w-2 h-2 bg-balai-gold rounded-full"></span> 12 & 24-Hour Overnight
               </li>
            </ul>
             <div class="pt-6">
               <RouterLink to="/rooms" class="inline-flex items-center gap-2 border border-balai-dark hover:bg-balai-dark hover:text-white px-8 py-3 text-sm font-medium tracking-wider uppercase transition-colors">
                 Check Rates <ChevronRightIcon class="w-4 h-4" />
               </RouterLink>
            </div>
          </div>
        </div>

      </div>
    </section>

    <section id="our-rooms-section" class="container mx-auto px-6 py-16 md:py-24 text-center">
       <h2 class="font-serif text-3xl md:text-4xl mb-4">OUR ROOMS</h2>
       <p class="text-gray-600 max-w-md mx-auto mb-12 text-sm md:text-base">
          Choose from our selection of thoughtfully designed rooms, perfect for relaxation or productivity.
       </p>

       <div v-if="isLoading" class="py-20">
         <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-balai-gold mx-auto"></div>
         <p class="text-gray-500 mt-4">Loading rooms...</p>
       </div>

       <div v-else-if="error" class="py-20 bg-red-50 border border-red-200 rounded-lg">
         <p class="text-red-600">{{ error }}</p>
         <button @click="fetchRooms" class="mt-4 text-balai-gold underline">Try Again</button>
       </div>

       <template v-else>
         <TransitionGroup 
            name="list" 
            tag="div" 
            class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12"
         >
            <div 
              v-for="(room, index) in visibleRooms" 
              :key="room.id"
              :data-room-index="index"
              class="bg-white shadow-md hover:shadow-xl transition-all duration-300 relative group overflow-hidden cursor-pointer text-left"
            >
               <!-- Dynamic Image -->
               <div class="aspect-[4/3] bg-gray-300 relative overflow-hidden">
                  <img 
                    v-if="getPrimaryImage(room)" 
                    :src="getPrimaryImage(room)" 
                    :alt="room.name"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
               </div>
               
               <div class="p-6 md:p-8">
                  <div class="flex justify-between items-start mb-4">
                    <h3 class="font-serif text-2xl">{{ room.name }}</h3>
                    <div class="text-right">
                      <span class="block font-bold text-balai-gold-dark">{{ room.price }}</span>
                      <span class="text-xs text-gray-400 uppercase tracking-wide">Starting ({{ room.duration }})</span>
                    </div>
                  </div>
                  <p class="text-gray-600 text-sm leading-relaxed mb-6">{{ room.desc }}</p>
                  
                  <RouterLink to="/rooms" class="text-xs font-bold uppercase tracking-widest border-b border-balai-gold pb-1 hover:text-balai-gold transition-colors">
                     View Full Details
                  </RouterLink>
               </div>
            </div>
         </TransitionGroup>

         <button 
           v-if="rooms.length > 2"
           @click="toggleRooms"
           data-rooms-toggle
           class="bg-balai-gold hover:bg-balai-gold-dark text-white px-10 py-4 font-medium text-sm tracking-wider uppercase transition-colors w-full md:w-auto inline-flex items-center justify-center gap-2"
         >
           {{ showAllRooms ? 'Show Less' : 'View All Accommodations' }}
           <ChevronUpIcon v-if="showAllRooms" class="w-4 h-4" />
           <ChevronDownIcon v-else class="w-4 h-4" />
         </button>
       </template>

    </section>

    <section class="bg-white py-16 md:py-32 relative z-0">
      <div class="container mx-auto px-4 md:px-6">
        <div class="flex flex-col md:flex-row items-center gap-12 md:gap-20">
           
           <div class="w-full md:w-1/2 relative group">
              <div class="absolute -top-4 -left-4 w-full h-full border-2 border-balai-gold z-0 hidden md:block"></div>
              <div class="relative z-10 aspect-[4/5] overflow-hidden shadow-2xl">
                 <img 
                   src="/images/amenities/justdrink.png" 
                   alt="Just Drink Coffee & Food Spread" 
                   class="w-full h-full object-cover"
                 />
              </div>
           </div>

           <div class="w-full md:w-1/2 space-y-8 text-center md:text-left">
              <div>
                 <span class="text-balai-gold-dark font-bold text-xs uppercase tracking-[0.2em] mb-2 block">
                    In-House Dining
                 </span>
                 <h2 class="font-serif text-3xl md:text-5xl text-balai-dark leading-tight mb-6">
                    Coffee & <br> <span class="italic text-balai-gold-dark">Comfort Food.</span>
                 </h2>
                 <p class="text-gray-600 leading-relaxed text-lg">
                    Guests can enjoy <strong>artisanal coffee</strong> and <strong>hearty meals</strong>, thoughtfully prepared for a satisfying dining experience.
                 </p>
              </div>

              <div class="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8 text-left">
                 <div>
                    <h4 class="font-serif text-xl mb-3 text-balai-dark flex items-center gap-2"><CakeIcon class="w-5 h-5 text-balai-gold" /> Signature Sips</h4>
                    <ul class="text-sm text-gray-500 space-y-2">
                       <li>Spanish Latte</li>
                       <li>Sea Salt Latte</li>
                       <li>Dirty Matcha</li>
                       <li>Berry Refreshers</li>
                    </ul>
                 </div>
                 <div>
                    <h4 class="font-serif text-xl mb-3 text-balai-dark flex items-center gap-2"><FireIcon class="w-5 h-5 text-balai-gold" /> All-Day Dining</h4>
                    <ul class="text-sm text-gray-500 space-y-2">
                       <li>Classic Tapsilog & Tosilog</li>
                       <li>Creamy Tuna Pesto</li>
                       <li>Chicken Alfredo</li>
                       <li>Hungarian Sausage & Fries</li>
                    </ul>
                 </div>
              </div>
              <div class="pt-4">
                 <p class="font-serif italic text-balai-dark text-lg">"Room service available for all guests."</p>
              </div>
           </div>
        </div>
      </div>
    </section>

    <section class="bg-balai-gold py-12 md:py-16 px-4 md:px-0">
       <div class="text-white container mx-auto p-8 md:p-12">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
             <div>
                <span class="font-serif text-sm block mb-2 opacity-90">Ready to stay?</span>
                <h2 class="font-serif text-2xl md:text-4xl mb-2">Experience Balai Almeda</h2>
             </div>
             <div class="flex flex-col items-start md:items-end gap-6 w-full md:w-auto z-10">
                <RouterLink to="/rooms" class="bg-white text-balai-dark w-full md:w-auto px-8 py-3 flex justify-center md:justify-start items-center gap-2 font-medium text-sm tracking-wider uppercase hover:bg-gray-100 transition-colors">
                   BOOK A ROOM <ChevronRightIcon class="w-4 h-4" />
                </RouterLink>
                <div class="text-left md:text-right w-full">
                   <p class="font-medium text-sm opacity-90">Have a question?</p>
                   <p class="text-xl font-serif">Call us: 0995 420 6515</p>
                </div>
             </div>
          </div>
       </div>
    </section>

  </main>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>