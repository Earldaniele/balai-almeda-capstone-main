<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore.js'

const router = useRouter()
const appStore = useAppStore()

// Show dirty rooms + rooms about to check out from the offline-first store
const tasks = computed(() => {
  return appStore.rooms.filter(r => r.status === 'Dirty' || (r.status === 'Occupied' && r.urgent))
})

const markClean = async (id) => {
  await appStore.markRoomClean(id)
  // After marking clean, redirect to dashboard if all clean
  if (tasks.value.filter(t => t.status === 'Dirty').length === 0) {
    router.push('/admin/dashboard')
  }
}

</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Housekeeping Tasks</h1>
      <span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{{ tasks.filter(t => t.status === 'Dirty').length }} Dirty Rooms</span>
    </div>

    <div class="space-y-4">
      <div 
        v-for="task in tasks" 
        :key="task.id"
        class="bg-white rounded-xl p-5 border shadow-sm flex items-center justify-between"
        :class="task.status === 'Dirty' ? 'border-amber-200' : 'border-gray-200 opacity-75'"
      >
        <div class="flex items-center gap-4">
          <div 
            class="w-16 h-16 rounded-lg flex flex-col items-center justify-center border-2"
            :class="task.status === 'Dirty' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'"
          >
            <span class="text-xl font-bold leading-none">{{ task.number }}</span>
            <span class="text-xs uppercase font-bold">{{ task.suffix }}</span>
          </div>
          
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-bold text-gray-900">{{ task.type }} Room</span>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white"
                :class="task.status === 'Dirty' ? 'bg-amber-500' : 'bg-blue-500'">
                {{ task.status }}
              </span>
            </div>
            <p v-if="task.status === 'Dirty'" class="text-xs text-amber-700 font-medium">Checked out {{ task.checkOut || 'recently' }}</p>
            <p v-else class="text-xs text-blue-600 font-medium">{{ task.note }}</p>
          </div>
        </div>

        <button 
          v-if="task.status === 'Dirty'"
          @click="markClean(task.id)"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          Mark Clean
        </button>
      </div>

      <div v-if="tasks.filter(t => t.status === 'Dirty').length === 0" class="text-center py-12">
        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p class="text-gray-500 font-medium">All rooms are clean!</p>
      </div>
    </div>
  </div>
</template>