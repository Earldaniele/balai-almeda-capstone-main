/**
 * appStore.js — Main Pinia store with offline-first data management
 * 
 * FLOW:
 * 1. On app start → load data from IndexedDB (instant, offline-safe)
 * 2. If online + authenticated → fetch fresh data from API, update IndexedDB + reactive state
 * 3. On mutations → update IndexedDB immediately, call API if online, queue if offline
 * 4. On reconnect → replay sync queue against server
 */

import { ref, computed, toRaw } from 'vue'
import { defineStore } from 'pinia'
import db from '../utils/offlineDb.js'
import { enqueue } from '../utils/syncQueue.js'
import { checkOnline } from '../composables/useOnlineStatus.js'
import * as api from '../services/api.js'

// Deep-clone a reactive object into a plain object safe for IndexedDB
function deepClone(obj) {
  return JSON.parse(JSON.stringify(toRaw(obj)))
}

export const useAppStore = defineStore('app', () => {
  // ========== REACTIVE STATE ==========
  const rooms = ref([])
  const bookings = ref([])
  const staff = ref([])
  const attendance = ref([])
  const menuItems = ref([])
  const orders = ref([])
  const shiftData = ref(null)
  const dashboardStats = ref(null)
  const currentUser = ref(null)
  const isLoading = ref(true)
  const lastSynced = ref(null)
  const pendingSyncCount = ref(0)

  // ========== COMPUTED ==========
  const availableRooms = computed(() => rooms.value.filter(r => r.status === 'Available'))
  const occupiedRooms = computed(() => rooms.value.filter(r => r.status === 'Occupied'))
  const dirtyRooms = computed(() => rooms.value.filter(r => r.status === 'Dirty'))
  const maintenanceRooms = computed(() => rooms.value.filter(r => r.status === 'Maintenance'))
  const occupancyRate = computed(() => {
    if (rooms.value.length === 0) return 0
    return Math.round((occupiedRooms.value.length / rooms.value.length) * 100)
  })

  // ========== INITIALIZATION ==========
  async function initialize() {
    isLoading.value = true
    try {
      // 1. Load cached data from IndexedDB first (instant offline access)
      const [localRooms, localBookings, localStaff, localOrders] = await Promise.all([
        db.getAll('rooms').catch(() => []),
        db.getAll('bookings').catch(() => []),
        db.getAll('staff').catch(() => []),
        db.getAll('orders').catch(() => []),
      ])

      if (localRooms.length > 0) rooms.value = localRooms
      if (localBookings.length > 0) bookings.value = localBookings
      if (localStaff.length > 0) staff.value = localStaff
      if (localOrders.length > 0) orders.value = localOrders

      // 2. Load stored user from localStorage
      const storedUser = api.getStoredUser()
      if (storedUser) currentUser.value = storedUser

      // 3. Update pending sync count
      await refreshPendingCount()

      // 4. If online + authenticated, fetch fresh data from server (overrides cached data)
      if (checkOnline() && api.isAuthenticated()) {
        console.log('[AppStore] Online + authenticated → fetching fresh data from server...')
        await fetchAllFromServer()
        console.log('[AppStore] Server data loaded. Rooms:', rooms.value.length, 'Bookings:', bookings.value.length)
      } else {
        console.warn('[AppStore] Offline or not authenticated. Online:', checkOnline(), 'Auth:', api.isAuthenticated())
      }

      // 5. Last sync time
      const meta = await db.getById('appMeta', 'lastSynced').catch(() => null)
      if (meta) lastSynced.value = meta.value
    } catch (error) {
      console.error('[AppStore] Initialize error:', error)
    } finally {
      isLoading.value = false
    }
  }

  // ========== SERVER FETCH ==========
  async function fetchAllFromServer() {
    try {
      await Promise.allSettled([
        fetchRoomsFromServer(),
        fetchBookingsFromServer(),
        fetchStaffFromServer(),
        fetchMenuFromServer(),
        fetchDashboardStatsFromServer(),
      ])

      lastSynced.value = new Date().toISOString()
      await db.put('appMeta', { key: 'lastSynced', value: lastSynced.value })
    } catch (error) {
      console.warn('[AppStore] Server fetch failed, using cached data:', error.message)
    }
  }

  async function fetchRoomsFromServer() {
    try {
      const data = await api.fetchRooms()
      if (data.success && data.rooms) {
        rooms.value = data.rooms
        await db.clearStore('rooms')
        await db.putMany('rooms', data.rooms)
      }
    } catch (e) {
      console.warn('[AppStore] Rooms fetch failed:', e.message)
    }
  }

  async function fetchBookingsFromServer() {
    try {
      const data = await api.fetchBookings()
      if (data.success && data.bookings) {
        bookings.value = data.bookings
        await db.clearStore('bookings')
        await db.putMany('bookings', data.bookings)
      }
    } catch (e) {
      console.warn('[AppStore] Bookings fetch failed:', e.message)
    }
  }

  async function fetchStaffFromServer() {
    try {
      const data = await api.fetchStaff()
      if (data.success && data.staff) {
        staff.value = data.staff
        await db.clearStore('staff')
        await db.putMany('staff', data.staff)
      }
    } catch (e) {
      console.warn('[AppStore] Staff fetch failed:', e.message)
    }
  }

  async function fetchMenuFromServer() {
    try {
      const data = await api.fetchMenuItems()
      if (data.success && data.items) {
        menuItems.value = data.items
      }
    } catch (e) {
      console.warn('[AppStore] Menu fetch failed:', e.message)
    }
  }

  async function fetchShiftData() {
    try {
      const data = await api.fetchCurrentShift()
      if (data.success) {
        shiftData.value = data.shift
      }
    } catch (e) {
      console.warn('[AppStore] Shift fetch failed:', e.message)
    }
  }

  async function fetchDashboardStatsFromServer() {
    try {
      const data = await api.fetchDashboardStats()
      if (data.success) {
        dashboardStats.value = data.stats
      }
    } catch (e) {
      console.warn('[AppStore] Dashboard stats fetch failed:', e.message)
    }
  }

  async function refreshPendingCount() {
    try {
      const pending = await db.getByIndex('syncQueue', 'status', 'pending')
      pendingSyncCount.value = pending.length
    } catch {
      pendingSyncCount.value = 0
    }
  }

  // ========== ROOM MUTATIONS ==========

  async function updateRoomStatus(roomId, newStatus) {
    // 1. Update reactive state immediately (optimistic)
    const room = rooms.value.find(r => r.id === roomId || r.room_id === roomId)
    if (!room) return

    const oldStatus = room.status
    room.status = newStatus

    if (newStatus === 'Available') {
      room.guest = null
      room.timeLeft = null
      room.checkIn = null
      room.urgent = false
      room.checkOut = null
    }

    // 2. Persist to IndexedDB (deepClone strips Vue Proxy so IndexedDB can clone it)
    await db.put('rooms', deepClone(room))

    // 3. Try API call, queue if offline
    if (checkOnline() && api.isAuthenticated()) {
      try {
        const result = await api.updateRoomStatus(roomId, newStatus)
        console.log('[AppStore] Room status updated on server:', result)
        // Re-fetch rooms from server to ensure consistency
        await fetchRoomsFromServer()
      } catch (err) {
        console.error('[AppStore] updateRoomStatus API FAILED:', err.message)
        // Revert optimistic update since server call failed
        room.status = oldStatus
        await db.put('rooms', deepClone(room))
        alert(`Failed to update room status: ${err.message}`)
      }
    } else {
      await enqueue('UPDATE_ROOM_STATUS', { roomId, status: newStatus }, `/api/ims/rooms/${roomId}/status`, 'PATCH')
    }
    await refreshPendingCount()
  }

  async function markRoomClean(roomId) {
    await updateRoomStatus(roomId, 'Available')
  }

  // ========== BOOKING MUTATIONS ==========

  async function updateBookingStatus(bookingId, newStatus) {
    const booking = bookings.value.find(b => b.bookingId === bookingId || b.booking_id === bookingId || b.id === bookingId)
    if (!booking) return

    const oldStatus = booking.status
    booking.status = newStatus
    await db.put('bookings', deepClone(booking))

    if (checkOnline() && api.isAuthenticated()) {
      try {
        const result = await api.updateBookingStatus(bookingId, newStatus)
        console.log('[AppStore] Booking status updated on server:', result)
        // Refresh BOTH rooms and bookings since check-in/check-out changes room status
        await Promise.all([fetchRoomsFromServer(), fetchBookingsFromServer()])
      } catch (err) {
        console.error('[AppStore] updateBookingStatus API FAILED:', err.message)
        // Revert optimistic update since server call failed
        booking.status = oldStatus
        await db.put('bookings', deepClone(booking))
        alert(`Failed to update booking status: ${err.message}`)
      }
    } else {
      await enqueue('UPDATE_BOOKING_STATUS', { bookingId, status: newStatus }, `/api/ims/bookings/${bookingId}/status`, 'PATCH')
    }
    await refreshPendingCount()
  }

  async function createWalkIn(data) {
    if (checkOnline() && api.isAuthenticated()) {
      const result = await api.createWalkInBooking(data)
      // Refresh after creating
      await Promise.all([fetchRoomsFromServer(), fetchBookingsFromServer()])
      return result
    } else {
      throw new Error('Walk-in bookings require an internet connection')
    }
  }

  // ========== ORDER MUTATIONS (POS) ==========

  async function submitOrder(orderData) {
    if (checkOnline() && api.isAuthenticated()) {
      const result = await api.createOrder(orderData)
      return result
    } else {
      // Queue for later
      await enqueue('CREATE_ORDER', orderData, '/api/ims/orders', 'POST')
      await refreshPendingCount()
      return { success: true, queued: true }
    }
  }

  // ========== SHIFT ==========

  async function submitShift(data) {
    if (checkOnline() && api.isAuthenticated()) {
      return await api.submitShiftReport(data)
    } else {
      await enqueue('SUBMIT_SHIFT', data, '/api/ims/shift/submit', 'POST')
      await refreshPendingCount()
      return { success: true, queued: true }
    }
  }

  // ========== AUTH ==========

  async function loginUser(email, password) {
    const data = await api.login(email, password)
    if (data.success) {
      currentUser.value = data.user
      // Fetch all data after login
      await fetchAllFromServer()
    }
    return data
  }

  async function logoutUser() {
    api.logout()
    currentUser.value = null
    rooms.value = []
    bookings.value = []
    staff.value = []
    menuItems.value = []
    shiftData.value = null
    dashboardStats.value = null
    // Clear IndexedDB to prevent stale data on next login
    await Promise.all([
      db.clearStore('rooms').catch(() => {}),
      db.clearStore('bookings').catch(() => {}),
      db.clearStore('staff').catch(() => {}),
      db.clearStore('orders').catch(() => {}),
    ])
  }

  return {
    // State
    rooms,
    bookings,
    staff,
    attendance,
    menuItems,
    orders,
    shiftData,
    dashboardStats,
    currentUser,
    isLoading,
    lastSynced,
    pendingSyncCount,

    // Computed
    availableRooms,
    occupiedRooms,
    dirtyRooms,
    maintenanceRooms,
    occupancyRate,

    // Init & Fetch
    initialize,
    fetchAllFromServer,
    fetchRoomsFromServer,
    fetchBookingsFromServer,
    fetchStaffFromServer,
    fetchMenuFromServer,
    fetchShiftData,
    fetchDashboardStatsFromServer,
    refreshPendingCount,

    // Mutations
    updateRoomStatus,
    markRoomClean,
    updateBookingStatus,
    createWalkIn,
    submitOrder,
    submitShift,

    // Auth
    loginUser,
    logoutUser,
  }
})
