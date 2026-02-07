<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeIcon,
  CalendarIcon,
  ShoppingCartIcon,
  BeakerIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { useOnlineStatus } from '../composables/useOnlineStatus.js'
import { useAppStore } from '../stores/appStore.js'

const router = useRouter()
const route = useRoute()
const { isOnline } = useOnlineStatus()
const appStore = useAppStore()

// Staff name from store (falls back to "Staff")
const currentStaff = computed(() => {
  const user = appStore.currentUser
  if (!user) return 'Staff'
  return user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Staff'
})
const currentTime = ref(new Date())

let timer
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
  { name: 'Reservations', path: '/admin/reservations', icon: CalendarIcon },
  { name: 'POS & Orders', path: '/admin/pos', icon: ShoppingCartIcon },
  { name: 'Housekeeping', path: '/admin/housekeeping', icon: BeakerIcon },
  { name: 'HR & Staff', path: '/admin/hr', icon: UserGroupIcon },
  { name: 'Shift & Cash', path: '/admin/shift', icon: CurrencyDollarIcon },
  { name: 'Reports', path: '/admin/reports', icon: ChartBarIcon },
]

const isActive = (path) => route.path === path

const handleSignOut = async () => {
  await appStore.logoutUser()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-[#F9FAFB] font-[Inter]">
    
    <aside class="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
      <div class="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100">
        <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
        <span class="ml-3 font-bold text-gray-900 hidden lg:block tracking-tight">Balai Almeda</span>
      </div>

      <nav class="flex-1 py-6 px-3 space-y-1">
        <router-link 
          v-for="item in menuItems" 
          :key="item.name" 
          :to="item.path"
          class="flex items-center px-3 py-2.5 rounded-lg transition-all group"
          :class="isActive(item.path) ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 transition-colors" 
            :class="isActive(item.path) ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'"
          />
          <span class="ml-3 font-medium text-sm hidden lg:block">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
            {{ currentStaff.charAt(0) }}
          </div>
          <div class="hidden lg:block">
            <p class="text-sm font-medium text-gray-900">{{ currentStaff }}</p>
            <p class="text-xs flex items-center gap-1" :class="isOnline ? 'text-green-600' : 'text-amber-600'">
              <span class="w-1.5 h-1.5 rounded-full" :class="isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'"></span> 
              {{ isOnline ? 'Online' : 'Offline' }}
            </p>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-800 tracking-tight">{{ route.name || 'Overview' }}</h2>
          <span v-if="appStore.pendingSyncCount > 0" class="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {{ appStore.pendingSyncCount }} pending sync
          </span>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="text-right hidden md:block">
            <p class="text-sm font-medium text-gray-900 font-mono">
              {{ currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
            <p class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              {{ currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' }) }}
            </p>
          </div>
          <button @click="handleSignOut" class="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-red-100">
            Sign Out
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>