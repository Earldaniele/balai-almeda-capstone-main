<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'

const appStore = useAppStore()

// --- STATE ---
const viewMode = ref('grid') // 'grid' | 'list'
const searchQuery = ref('')
const filterStatus = ref('All')
const filterType = ref('All')
const rowsPerPage = ref('All') // 5, 10, 15, 'All'
const currentPage = ref(1)

// --- DATA FROM OFFLINE-FIRST STORE (IndexedDB-backed) ---
const rooms = computed(() => appStore.rooms)

const stats = computed(() => [
  { label: 'Available', value: appStore.availableRooms.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Occupied', value: appStore.occupiedRooms.length, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Dirty', value: appStore.dirtyRooms.length, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Maintenance', value: (appStore.maintenanceRooms?.length || 0), color: 'text-gray-500', bg: 'bg-gray-100' },
])

// --- COMPUTED LOGIC ---

// 1. Filter the raw list
const filteredRooms = computed(() => {
  return rooms.value.filter(room => {
    // Search (Number or Guest)
    const searchLower = searchQuery.value.toLowerCase()
    const matchSearch = 
      (room.number + room.suffix).toLowerCase().includes(searchLower) ||
      (room.guest && room.guest.toLowerCase().includes(searchLower))

    // Filter Status
    const matchStatus = filterStatus.value === 'All' || room.status === filterStatus.value

    // Filter Type
    const matchType = filterType.value === 'All' || room.type === filterType.value

    return matchSearch && matchStatus && matchType
  })
})

// 2. Paginate the filtered list (For Table Mode)
const paginatedRooms = computed(() => {
  if (rowsPerPage.value === 'All') return filteredRooms.value
  
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end = start + rowsPerPage.value
  return filteredRooms.value.slice(start, end)
})

// Reset page when filters change
const resetPagination = () => {
  currentPage.value = 1
}

// Total pages calculation
const totalPages = computed(() => {
  if (rowsPerPage.value === 'All') return 1
  return Math.ceil(filteredRooms.value.length / rowsPerPage.value)
})

// --- HELPER FUNCTIONS ---
const getStatusColor = (status) => {
  switch(status) {
    case 'Available': return 'bg-emerald-50 text-emerald-600 ring-emerald-600/20'
    case 'Occupied': return 'bg-blue-50 text-blue-600 ring-blue-600/20'
    case 'Dirty': return 'bg-amber-50 text-amber-600 ring-amber-600/20'
    case 'Maintenance': return 'bg-gray-100 text-gray-500 ring-gray-500/20'
    default: return 'bg-gray-50 text-gray-600'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{{ stat.label }}</span>
          <span class="text-2xl font-bold tracking-tight" :class="stat.color">{{ stat.value }}</span>
        </div>
        <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="stat.bg">
          <div class="w-2 h-2 rounded-full" :class="stat.color.replace('text', 'bg')"></div>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4 shadow-md flex items-center justify-between text-white">
        <div>
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Occupancy</span>
          <span class="text-2xl font-bold tracking-tight">{{ appStore.occupancyRate }}%</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
           <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
      </div>
    </div>

    <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center top-0 z-10">
      
      <div class="flex flex-1 gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div class="relative min-w-[240px]">
          <span class="absolute left-3 top-2.5 text-gray-400">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            v-model="searchQuery"
            @input="resetPagination"
            type="text" 
            placeholder="Search room or guest..." 
            class="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-gray-900 transition-all placeholder-gray-400"
          >
        </div>

        <select v-model="filterStatus" @change="resetPagination" class="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-neutral-400 cursor-pointer transition-all">
          <option value="All">All Status</option>
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Dirty">Dirty</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <select v-model="filterType" @change="resetPagination" class="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-neutral-400 cursor-pointer transition-all">
          <option value="All">All Types</option>
          <option value="Value">Value</option>
          <option value="Standard">Standard</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Superior">Superior</option>
        </select>
      </div>

      <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
        <button 
          @click="viewMode = 'grid'"
          class="p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium focus:outline-none"
          :class="viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span class="hidden sm:inline">Grid</span>
        </button>
        <button 
          @click="viewMode = 'list'"
          class="p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium focus:outline-none"
          :class="viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span class="hidden sm:inline">List</span>
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div 
        v-for="room in filteredRooms" 
        :key="room.id"
        class="group bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-gray-200 transition-all cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden"
      >
        <div class="absolute top-0 left-0 w-full h-1" 
          :class="{
            'bg-emerald-400': room.status === 'Available',
            'bg-blue-500': room.status === 'Occupied',
            'bg-amber-400': room.status === 'Dirty',
            'bg-gray-300': room.status === 'Maintenance'
          }"
        ></div>

        <div class="flex justify-between items-start">
          <div class="flex items-baseline">
            <span class="text-2xl font-bold text-gray-900">{{ room.number }}</span>
            <span class="text-sm font-medium text-gray-400 ml-0.5">{{ room.suffix }}</span>
          </div>
          <span class="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ring-1 ring-inset" :class="getStatusColor(room.status)">
            {{ room.status === 'Available' ? 'Free' : room.status }}
          </span>
        </div>

        <div class="mt-auto">
          <div v-if="room.status === 'Occupied'">
            <p class="text-xs font-medium text-gray-500 truncate mb-1">{{ room.guest }}</p>
            <div class="flex items-center gap-1.5" :class="room.urgent ? 'text-red-500 animate-pulse' : 'text-gray-800'">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span class="text-sm font-bold font-mono">{{ room.timeLeft }}</span>
              <span v-if="room.duration" class="text-[10px] text-gray-400 font-normal">({{ room.duration }})</span>
            </div>
          </div>
          <div v-if="room.status === 'Available'" class="opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="text-xs text-center font-medium text-emerald-600 bg-emerald-50 py-1.5 rounded-lg">Check In +</p>
          </div>
          <div v-if="room.status === 'Dirty'">
            <p class="text-xs text-amber-600 font-medium mb-1">Checked out {{ room.checkOut }}</p>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
               <button @click="appStore.markRoomClean(room.id)" class="w-full text-xs bg-amber-100 text-amber-800 font-bold py-1.5 rounded-lg">Cleaned</button>
             </div>
          </div>
           <div v-if="room.status === 'Maintenance'">
            <p class="text-xs text-gray-400">{{ room.note }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'list'" class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-4 font-semibold">Room No.</th>
              <th class="px-6 py-4 font-semibold">Type</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 font-semibold">Guest / Info</th>
              <th class="px-6 py-4 font-semibold">Time / Duration</th>
              <th class="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="room in paginatedRooms" :key="room.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-6 py-4">
                <span class="font-bold text-gray-900 text-base">{{ room.number }}{{ room.suffix }}</span>
              </td>
              <td class="px-6 py-4 text-gray-600">{{ room.type }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset" :class="getStatusColor(room.status)">
                  {{ room.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div v-if="room.status === 'Occupied'">
                  <p class="font-medium text-gray-900">{{ room.guest }}</p>
                  <p class="text-xs text-gray-500">Checked in {{ room.checkIn }}</p>
                </div>
                <div v-else-if="room.status === 'Dirty'">
                   <p class="text-xs text-gray-500">Last checkout: {{ room.checkOut }}</p>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 font-mono">
                <div v-if="room.status === 'Occupied'">
                  <span :class="room.urgent ? 'text-red-600 font-bold' : 'text-gray-700'">{{ room.timeLeft }} left</span>
                  <p v-if="room.duration" class="text-xs text-gray-400 mt-0.5">Booked: {{ room.duration }}</p>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button v-if="room.status === 'Available'" class="text-emerald-600 hover:text-emerald-800 font-medium text-xs border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded transition-colors">
                  Walk-In
                </button>
                <button v-if="room.status === 'Dirty'" @click="appStore.markRoomClean(room.id)" class="text-amber-600 hover:text-amber-800 font-medium text-xs border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded transition-colors">
                  Mark Clean
                </button>
                <button v-if="room.status === 'Occupied'" class="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">
                  View Bill
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <div class="flex items-center gap-2">
          <span>Show:</span>
          <select v-model="rowsPerPage" @change="resetPagination" class="bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer">
            <option :value="5">5 rows</option>
            <option :value="10">10 rows</option>
            <option :value="15">15 rows</option>
            <option value="All">View All</option>
          </select>
        </div>

        <div v-if="rowsPerPage !== 'All'" class="flex items-center gap-2">
           <button 
             @click="currentPage > 1 && currentPage--" 
             :disabled="currentPage === 1"
             class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
           </button>
           <span>Page {{ currentPage }} of {{ totalPages }}</span>
           <button 
             @click="currentPage < totalPages && currentPage++" 
             :disabled="currentPage === totalPages"
             class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>
      </div>
    </div>

  </div>
</template>