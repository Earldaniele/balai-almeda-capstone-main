<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { isAuthenticated, getUserName, logout } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const isScrolled = ref(false)
const isMenuOpen = ref(false)
const isLoggedIn = ref(false)
const userName = ref('')
const showProfileMenu = ref(false)

// Check authentication status
const checkAuth = () => {
  isLoggedIn.value = isAuthenticated()
  if (isLoggedIn.value) {
    userName.value = getUserName() || 'Guest'
  }
}

// Close menu automatically when route changes
watch(route, () => {
  isMenuOpen.value = false
  showProfileMenu.value = false
  checkAuth()
})

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleLogout = () => {
  logout()
  isLoggedIn.value = false
  userName.value = ''
  showProfileMenu.value = false
  router.push('/')
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  checkAuth()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav 
    class="fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 py-4 flex justify-between items-center font-sans"
    :class="[
      (isScrolled || isMenuOpen) ? 'bg-white shadow-md' : 'bg-transparent',
      (isScrolled || isMenuOpen || route.path !== '/') ? 'text-balai-dark' : 'text-white'
    ]"
  >
    <div class="z-10 relative">
      <RouterLink to="/" class="hover:opacity-80 transition-opacity block">
        <img 
          src="/images/logo.svg" 
          alt="Balai Almeda" 
          class="h-20 w-auto transition-all duration-300"
          :class="(isScrolled || isMenuOpen || route.path !== '/') ? '' : 'brightness-0 invert'"
        />
      </RouterLink>
    </div>

    <div class="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 gap-8 text-xs font-medium tracking-widest uppercase z-0">
      <RouterLink to="/" class="hover:text-balai-gold transition-colors">Home</RouterLink>
      <RouterLink to="/rooms" class="hover:text-balai-gold transition-colors">Rooms</RouterLink>
      <RouterLink to="/virtual-tour" class="hover:text-balai-gold transition-colors">Virtual Tour</RouterLink>
      <RouterLink to="/location" class="hover:text-balai-gold transition-colors">Location</RouterLink>
      <RouterLink to="/contact" class="hover:text-balai-gold transition-colors">Contact</RouterLink>
    </div>

    <div class="hidden md:flex items-center gap-6 z-10">
      
      <div v-if="!isLoggedIn" class="flex items-center gap-6">
         <RouterLink to="/login" class="text-xs font-bold uppercase tracking-widest hover:text-balai-gold transition-colors">
            Log In
         </RouterLink>
         <RouterLink 
           to="/signup" 
           class="px-6 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors"
           :class="(isScrolled || isMenuOpen || route.path !== '/') ? 'bg-balai-dark text-white hover:bg-balai-gold' : 'bg-white text-balai-dark hover:bg-balai-gold hover:text-white'"
         >
            Sign Up
         </RouterLink>
      </div>

      <div v-else class="flex items-center gap-6">
        
        <RouterLink 
          to="/rooms" 
          class="px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
          :class="(isScrolled || isMenuOpen || route.path !== '/') ? 'bg-balai-dark text-white hover:bg-balai-gold' : 'bg-white text-balai-dark hover:bg-balai-gold hover:text-white'"
        >
          Book a Stay
        </RouterLink>

        <div 
          class="h-8 w-px transition-colors"
          :class="(isScrolled || isMenuOpen || route.path !== '/') ? 'bg-gray-200' : 'bg-white/30'"
        ></div>

        <div class="relative">
          <button 
            @click="toggleProfileMenu"
            class="flex items-center gap-3 group focus:outline-none text-left"
          >
            <div class="hidden lg:block">
              <span 
                class="block text-[9px] uppercase tracking-widest leading-none mb-1 text-right transition-colors"
                :class="(isScrolled || isMenuOpen || route.path !== '/') ? 'text-gray-400' : 'text-white/60'"
              >Account</span>
              <span class="block text-xs font-bold uppercase tracking-widest group-hover:text-balai-gold transition-colors">{{ userName }}</span>
            </div>
            
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif font-bold group-hover:border-balai-gold group-hover:bg-balai-gold group-hover:text-white transition-all shadow-sm"
              :class="(isScrolled || isMenuOpen || route.path !== '/') ? 'bg-white border border-gray-200 text-balai-dark' : 'bg-white/20 border border-white/40 text-white'"
            >
              {{ userName.charAt(0).toUpperCase() }}
            </div>
          </button>
          
          <transition name="fade">
            <div 
              v-if="showProfileMenu"
              class="absolute right-0 top-full mt-6 w-56 bg-white shadow-xl border-t-2 border-balai-gold z-50 py-2"
            >
              <div class="px-6 py-3 border-b border-gray-100 lg:hidden">
                <span class="text-xs font-bold uppercase text-balai-dark">{{ userName }}</span>
              </div>

              <RouterLink 
                to="/profile" 
                class="flex items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-balai-gold transition-colors"
              >
                My Profile
              </RouterLink>
              
              <RouterLink 
                to="/bookings" 
                class="flex items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-balai-gold transition-colors"
              >
                My Bookings
              </RouterLink>
              
              <div class="border-t border-gray-100 mt-1 pt-1">
                <button 
                  @click="handleLogout"
                  class="w-full text-left flex items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <button @click="toggleMenu" class="md:hidden text-2xl z-50 relative focus:outline-none transition-transform active:scale-90">
      <span v-if="!isMenuOpen">☰</span>
      <span v-else>✕</span>
    </button>

    <div 
      class="fixed inset-0 bg-white flex flex-col items-center justify-center gap-6 text-lg font-serif transition-transform duration-300 md:hidden"
      :class="[isMenuOpen ? 'translate-x-0' : 'translate-x-full']"
    >
      <RouterLink to="/" class="hover:text-balai-gold">Home</RouterLink>
      <RouterLink to="/rooms" class="hover:text-balai-gold">Rooms</RouterLink>
      <RouterLink to="/virtual-tour" class="hover:text-balai-gold">Virtual Tour</RouterLink>
      <RouterLink to="/location" class="hover:text-balai-gold">Location</RouterLink>
      <RouterLink to="/contact" class="hover:text-balai-gold">Contact</RouterLink>
      
      <div v-if="!isLoggedIn" class="flex flex-col items-center gap-4 mt-8 w-full px-12">
         <div class="w-12 border-t border-gray-200 mb-2"></div>
         <RouterLink to="/login" class="text-xs font-sans font-bold uppercase tracking-widest hover:text-balai-gold">
            Log In
         </RouterLink>
         <RouterLink to="/signup" class="bg-balai-dark text-white w-full py-4 text-center text-xs font-sans font-medium uppercase tracking-widest hover:bg-balai-gold">
            Sign Up
         </RouterLink>
      </div>

      <div v-else class="flex flex-col items-center gap-5 mt-6 w-full px-10">
         <div class="w-12 border-t border-gray-200 mb-2"></div>
         
         <div class="flex flex-col items-center mb-2">
            <div class="w-12 h-12 rounded-full bg-balai-dark text-white flex items-center justify-center text-xl font-serif mb-2 shadow-md">
              {{ userName.charAt(0).toUpperCase() }}
            </div>
            <span class="text-[10px] font-sans text-gray-400 uppercase tracking-widest">Welcome back</span>
            <span class="text-lg font-serif text-balai-dark">{{ userName }}</span>
         </div>

         <RouterLink to="/rooms" class="bg-balai-dark text-white w-full py-4 text-center text-xs font-sans font-bold uppercase tracking-widest hover:bg-balai-gold shadow-sm">
            Book a Stay
         </RouterLink>

         <div class="grid grid-cols-2 gap-3 w-full">
           <RouterLink to="/profile" class="text-center py-3 border border-gray-200 text-[10px] font-sans font-bold uppercase tracking-widest hover:border-balai-gold hover:text-balai-gold transition-colors">
             Profile
           </RouterLink>
           <RouterLink to="/bookings" class="text-center py-3 border border-gray-200 text-[10px] font-sans font-bold uppercase tracking-widest hover:border-balai-gold hover:text-balai-gold transition-colors">
             Bookings
           </RouterLink>
         </div>
         
         <button @click="handleLogout" class="mt-4 text-xs font-sans font-bold uppercase tracking-widest text-red-500 hover:text-red-700">
           Log Out
         </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>