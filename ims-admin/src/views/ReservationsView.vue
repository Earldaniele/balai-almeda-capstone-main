<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'

const appStore = useAppStore()

// --- STATE ---
const searchQuery = ref('')
const filterStatus = ref('All')
const sortColumn = ref('checkIn') // Default sort by date
const sortDirection = ref('desc') // Default newest first
const currentPage = ref(1)
const rowsPerPage = ref(10)

// --- DATA FROM OFFLINE-FIRST STORE (IndexedDB-backed) ---
const bookings = computed(() => appStore.bookings)

// --- COMPUTED LOGIC ---

const filteredBookings = computed(() => {
  let result = bookings.value

  // 1. Search Filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(b => 
      (b.guest || '').toLowerCase().includes(query) || 
      (b.id || '').toLowerCase().includes(query) ||
      (b.room || '').toLowerCase().includes(query)
    )
  }

  // 2. Status Filter
  if (filterStatus.value !== 'All') {
    result = result.filter(b => b.status === filterStatus.value)
  }

  // 3. Sorting Logic
  return result.sort((a, b) => {
    let modifier = sortDirection.value === 'asc' ? 1 : -1
    const aVal = a[sortColumn.value] || ''
    const bVal = b[sortColumn.value] || ''
    if (aVal < bVal) return -1 * modifier
    if (aVal > bVal) return 1 * modifier
    return 0
  })
})

// 4. Pagination
const paginatedBookings = computed(() => {
  if (rowsPerPage.value === 'All') return filteredBookings.value
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end = start + rowsPerPage.value
  return filteredBookings.value.slice(start, end)
})

const totalPages = computed(() => {
  if (rowsPerPage.value === 'All') return 1
  return Math.ceil(filteredBookings.value.length / rowsPerPage.value)
})

// --- ACTIONS ---

const handleSort = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  filterStatus.value = 'All'
  sortColumn.value = 'checkIn'
  sortDirection.value = 'desc'
  currentPage.value = 1
}

const handleCheckIn = async (bookingId) => {
  await appStore.updateBookingStatus(bookingId, 'Checked_In')
}

const handleCheckOut = async (bookingId) => {
  await appStore.updateBookingStatus(bookingId, 'Completed')
}

// --- HELPER FUNCTIONS ---
const formatDate = (isoString) => {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

const getStatusColor = (status) => {
  switch(status) {
    case 'Confirmed': return 'bg-blue-50 text-blue-700 ring-blue-600/20'
    case 'Checked In': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    case 'Checked Out': return 'bg-gray-100 text-gray-600 ring-gray-500/20'
    case 'Cancelled': return 'bg-red-50 text-red-600 ring-red-600/20'
    default: return 'bg-gray-50 text-gray-600'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Reservations</h1>
        <p class="text-sm text-gray-500">Manage bookings, walk-ins, and guest history.</p>
      </div>
      <button class="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Walk-In
      </button>
    </div>

    <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
      
      <div class="relative w-full md:w-64">
        <span class="absolute left-3 top-2.5 text-gray-400">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search guest, ref, or room..." 
          class="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-gray-900 transition-all placeholder-gray-400"
        >
      </div>

      <div class="w-full md:w-48">
        <select v-model="filterStatus" class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-gray-900 cursor-pointer transition-all">
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked In">Checked In</option>
          <option value="Checked Out">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <button 
        @click="resetFilters"
        class="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-2"
        v-if="searchQuery || filterStatus !== 'All' || sortColumn !== 'checkIn'"
      >
        Reset Filters
      </button>

      <div class="flex-1"></div>

      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {{ filteredBookings.length }} Results
      </span>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th 
                v-for="col in [
                  { key: 'id', label: 'Ref Code' },
                  { key: 'guest', label: 'Guest Name' },
                  { key: 'room', label: 'Room' },
                  { key: 'checkIn', label: 'Check-In Date' },
                  { key: 'duration', label: 'Duration' },
                  { key: 'source', label: 'Source' },
                  { key: 'status', label: 'Status' }
                ]" 
                :key="col.key"
                class="px-6 py-4 font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors group"
                @click="handleSort(col.key)"
              >
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  <div class="flex flex-col text-[8px] leading-[8px]">
                    <span :class="sortColumn === col.key && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-300 group-hover:text-gray-400'">▲</span>
                    <span :class="sortColumn === col.key && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-300 group-hover:text-gray-400'">▼</span>
                  </div>
                </div>
              </th>
              <th class="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="bkg in paginatedBookings" :key="bkg.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 font-mono text-gray-500 text-xs">{{ bkg.id }}</td>
              <td class="px-6 py-4 font-bold text-gray-900">{{ bkg.guest }}</td>
              <td class="px-6 py-4">
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{{ bkg.room }}</span>
              </td>
              <td class="px-6 py-4 text-gray-600 font-mono text-xs">{{ formatDate(bkg.checkIn) }}</td>
              <td class="px-6 py-4 text-gray-600">{{ bkg.duration }}</td>
              <td class="px-6 py-4 text-xs font-bold" :class="bkg.source === 'Online' ? 'text-blue-600' : 'text-purple-600'">
                {{ bkg.source }}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset"
                  :class="getStatusColor(bkg.status)">
                  {{ bkg.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-3">
                  <button v-if="bkg.status === 'Confirmed'" @click="handleCheckIn(bkg.bookingId || bkg.id)" class="text-blue-600 font-bold hover:text-blue-800 text-xs transition-colors">Check In</button>
                  <button v-if="bkg.status === 'Checked In'" @click="handleCheckOut(bkg.bookingId || bkg.id)" class="text-red-600 font-bold hover:text-red-800 text-xs transition-colors">Check Out</button>
                  <button class="text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedBookings.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-gray-400">
                No reservations found matching your filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <div class="flex items-center gap-2">
          <span>Show:</span>
          <select v-model="rowsPerPage" class="bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-gray-900 cursor-pointer">
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
             class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
           </button>
           <span>Page {{ currentPage }} of {{ totalPages }}</span>
           <button 
             @click="currentPage < totalPages && currentPage++" 
             :disabled="currentPage === totalPages"
             class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>
      </div>
    </div>

  </div>
</template>