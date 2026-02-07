<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore.js'

const router = useRouter()
const appStore = useAppStore()

const physicalCash = ref(0)
const expenses = ref(0)
const remarks = ref('')
const isSubmitting = ref(false)
const submitMsg = ref('')

// Fetch live shift data on mount
onMounted(async () => {
  await appStore.fetchShiftData()
})

// System data from API (fallback to defaults if not loaded)
const systemData = computed(() => appStore.shiftData || {
  initialCash: 5000,
  cashSales: 0,
  onlineSales: 0,
  orderSales: 0,
  totalSystemCash: 5000,
  totalBookings: 0,
  date: new Date().toISOString().split('T')[0]
})

const currentStaff = computed(() => appStore.currentUser?.name || 'Staff')

const variance = computed(() => {
  const expected = systemData.value.totalSystemCash - expenses.value
  return physicalCash.value - expected
})

const varianceColor = computed(() => {
  if (variance.value === 0) return 'text-green-600'
  return variance.value < 0 ? 'text-red-600' : 'text-blue-600'
})

const handleSubmitShift = async () => {
  isSubmitting.value = true
  submitMsg.value = ''
  try {
    const result = await appStore.submitShift({
      staffId: appStore.currentUser?.id,
      physicalCash: physicalCash.value,
      expenses: expenses.value,
      remarks: remarks.value
    })
    if (result.queued) {
      submitMsg.value = 'Shift report queued — will sync when online'
    }
    appStore.logoutUser()
    router.push('/login')
  } catch (err) {
    submitMsg.value = err.message || 'Failed to submit shift report'
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Daily Report</h1>
      <p class="text-gray-500">{{ systemData.date }} • {{ currentStaff }}</p>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-8">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 class="font-bold text-gray-500 uppercase text-xs tracking-wider mb-4">System Computation</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Initial Petty Cash</span>
            <span class="font-mono">₱{{ systemData.initialCash.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Cash Sales (Walk-In)</span>
            <span class="font-mono text-green-600">+₱{{ systemData.cashSales.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Online Sales</span>
            <span class="font-mono text-blue-600">₱{{ systemData.onlineSales.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Order Sales (POS)</span>
            <span class="font-mono text-purple-600">₱{{ (systemData.orderSales || 0).toLocaleString() }}</span>
          </div>
          <div class="pt-3 border-t flex justify-between font-bold">
            <span>Expected Cash on Hand</span>
            <span>₱{{ systemData.totalSystemCash.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border-2 border-balai-gold">
        <h3 class="font-bold text-balai-dark uppercase text-xs tracking-wider mb-4">Your Declaration</h3>
        
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1">Total Expenses (with Receipts)</label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-500">₱</span>
            <input v-model="expenses" type="number" class="w-full pl-8 p-2 border rounded focus:ring-2 focus:ring-balai-gold outline-none">
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-bold mb-1">Physical Cash Count</label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-500">₱</span>
            <input v-model="physicalCash" type="number" class="w-full pl-8 p-2 border rounded focus:ring-2 focus:ring-balai-gold outline-none font-bold text-lg">
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 text-center">
      <p class="text-sm text-gray-500 uppercase font-bold mb-2">Variance Check</p>
      <p class="text-4xl font-mono font-bold" :class="varianceColor">
        {{ variance > 0 ? '+' : '' }}₱{{ variance.toLocaleString() }}
      </p>
      <p class="text-sm mt-2" :class="variance === 0 ? 'text-green-600' : 'text-gray-500'">
        {{ variance === 0 ? 'Perfect Match' : 'Please explain the discrepancy below' }}
      </p>
    </div>

    <div v-if="variance !== 0" class="mb-8">
      <label class="block text-sm font-bold mb-2">Explanation / Remarks</label>
      <textarea v-model="remarks" class="w-full p-4 border rounded-lg h-32 focus:ring-2 focus:ring-red-200 outline-none" placeholder="E.g. Forgot to log grab food expense..."></textarea>
    </div>

    <p v-if="submitMsg" class="mb-4 text-center text-sm" :class="submitMsg.includes('Failed') ? 'text-red-600' : 'text-amber-600'">{{ submitMsg }}</p>
    <button @click="handleSubmitShift" :disabled="isSubmitting" class="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
      {{ isSubmitting ? 'Submitting...' : 'Lock & Submit Shift Report' }}
    </button>
  </div>
</template>