<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/appStore.js'

const appStore = useAppStore()

const activeTab = ref('In-House')
const cart = ref([])
const selectedRoom = ref(null)
const isSubmitting = ref(false)
const orderMessage = ref('')

// Fetch menu items on mount
onMounted(async () => {
  if (appStore.menuItems.length === 0) {
    await appStore.fetchMenuFromServer()
  }
})

// Group menu items by provider (In-House / Partner)
const activeMenu = computed(() => {
  return appStore.menuItems.filter(item => item.provider === activeTab.value)
})

// Occupied rooms for the room selector
const occupiedRooms = computed(() => appStore.occupiedRooms)

const addToCart = (item) => {
  const existing = cart.value.find(i => i.id === item.id)
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ ...item, qty: 1 })
  }
}

const removeFromCart = (itemId) => {
  const idx = cart.value.findIndex(i => i.id === itemId)
  if (idx !== -1) {
    if (cart.value[idx].qty > 1) {
      cart.value[idx].qty--
    } else {
      cart.value.splice(idx, 1)
    }
  }
}

const total = computed(() => cart.value.reduce((sum, item) => sum + (item.price * item.qty), 0))

const chargeToRoom = async () => {
  if (!selectedRoom.value || cart.value.length === 0) return
  isSubmitting.value = true
  orderMessage.value = ''
  try {
    const room = occupiedRooms.value.find(r => r.id === selectedRoom.value)
    const result = await appStore.submitOrder({
      bookingId: room?.bookingId || selectedRoom.value,
      items: cart.value.map(i => ({ id: i.id, qty: i.qty, price: i.price })),
      totalCost: total.value
    })
    if (result.queued) {
      orderMessage.value = 'Order queued — will sync when online'
    } else {
      orderMessage.value = 'Order charged successfully!'
    }
    cart.value = []
    selectedRoom.value = null
  } catch (err) {
    orderMessage.value = err.message || 'Failed to charge order'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-100px)] gap-6">
    
    <div class="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div class="flex border-b">
        <button 
          @click="activeTab = 'In-House'" 
          class="flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors"
          :class="activeTab === 'In-House' ? 'bg-balai-gold text-white' : 'hover:bg-gray-50 text-gray-500'"
        >
          In-House Inventory
        </button>
        <button 
          @click="activeTab = 'Partner'" 
          class="flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors"
          :class="activeTab === 'Partner' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-50 text-gray-500'"
        >
          Partner (Just Drink)
        </button>
      </div>

      <div class="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <button 
          v-for="item in activeMenu" 
          :key="item.id"
          @click="addToCart(item)"
          class="border rounded-lg p-4 hover:border-balai-gold hover:bg-yellow-50 transition text-left flex flex-col h-32 justify-between group"
        >
          <div>
            <span class="text-xs text-gray-400 uppercase font-bold">{{ item.category }}</span>
            <p class="font-bold text-gray-800 group-hover:text-balai-dark">{{ item.name }}</p>
          </div>
          <p class="font-mono text-lg font-bold text-balai-gold">₱{{ item.price }}</p>
        </button>
      </div>
    </div>

    <div class="w-96 bg-white rounded-xl shadow-sm flex flex-col">
      <div class="p-6 border-b bg-gray-50">
        <h3 class="font-bold text-gray-700">Current Order</h3>
        <select v-model="selectedRoom" class="w-full mt-2 p-2 border rounded bg-white font-mono">
          <option :value="null">-- Select Occupied Room --</option>
          <option v-for="room in occupiedRooms" :key="room.id" :value="room.id">
            {{ room.number }}{{ room.suffix }} ({{ room.guest || 'Guest' }})
          </option>
        </select>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <div v-if="cart.length === 0" class="text-center text-gray-400 mt-10">
          <p>Cart is empty</p>
        </div>
        <div v-for="item in cart" :key="item.id" class="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <p class="font-bold text-sm">{{ item.name }}</p>
            <p class="text-xs text-gray-500">₱{{ item.price }} x {{ item.qty }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold">₱{{ item.price * item.qty }}</span>
            <button @click="removeFromCart(item.id)" class="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        </div>
      </div>

      <div class="p-6 bg-gray-900 text-white">
        <p v-if="orderMessage" class="text-xs mb-2 text-center" :class="orderMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'">{{ orderMessage }}</p>
        <div class="flex justify-between items-center mb-4">
          <span class="text-gray-400">Total</span>
          <span class="text-2xl font-bold font-mono">₱{{ total }}</span>
        </div>
        <button 
          @click="chargeToRoom"
          class="w-full bg-balai-gold text-slate-900 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="cart.length === 0 || !selectedRoom || isSubmitting"
        >
          {{ isSubmitting ? 'Processing...' : 'Charge to Room' }}
        </button>
      </div>
    </div>

  </div>
</template>