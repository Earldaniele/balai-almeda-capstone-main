<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'

const appStore = useAppStore()
const activeTab = ref('staff')

// Data from offline-first store (IndexedDB-backed)
const staff = computed(() => appStore.staff)
const attendance = computed(() => appStore.attendance)
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Human Resources</h1>
        <p class="text-sm text-gray-500">Manage staff, attendance, and payroll.</p>
      </div>
      <button class="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
        + Add Employee
      </button>
    </div>

    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-6">
        <button 
          @click="activeTab = 'staff'"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'staff' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Staff Directory
        </button>
        <button 
          @click="activeTab = 'attendance'"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'attendance' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Attendance Logs
        </button>
        <button 
          @click="activeTab = 'payroll'"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'payroll' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Payroll
        </button>
      </nav>
    </div>

    <div v-if="activeTab === 'staff'" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-6 py-4 font-semibold">Name</th>
            <th class="px-6 py-4 font-semibold">Role</th>
            <th class="px-6 py-4 font-semibold">Hourly Rate</th>
            <th class="px-6 py-4 font-semibold">Status</th>
            <th class="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="emp in staff" :key="emp.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 font-medium text-gray-900">{{ emp.name }}</td>
            <td class="px-6 py-4 text-gray-600">{{ emp.role }}</td>
            <td class="px-6 py-4 font-mono text-gray-600">₱{{ emp.rate }}/hr</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                {{ emp.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-right text-gray-400">
              <button class="hover:text-blue-600 mr-3">Edit</button>
              <button class="hover:text-red-600">Archive</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'attendance'" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-6 py-4 font-semibold">Date</th>
            <th class="px-6 py-4 font-semibold">Staff Member</th>
            <th class="px-6 py-4 font-semibold">Time In</th>
            <th class="px-6 py-4 font-semibold">Time Out</th>
            <th class="px-6 py-4 font-semibold">Total Hours</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="log in attendance" :key="log.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-gray-500">{{ log.date }}</td>
            <td class="px-6 py-4 font-medium text-gray-900">{{ log.staff }}</td>
            <td class="px-6 py-4 font-mono text-green-600">{{ log.in }}</td>
            <td class="px-6 py-4 font-mono text-red-600">{{ log.out }}</td>
            <td class="px-6 py-4 font-mono font-bold">{{ log.hours }}h <span v-if="log.ot > 0" class="text-amber-600 text-xs ml-1">({{ log.ot }}h OT)</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'payroll'" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h3 class="text-lg font-bold text-gray-900">Payroll Generation</h3>
      <p class="text-gray-500 mb-6">Select a cutoff period to generate payslips based on attendance logs.</p>
      <button class="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
        Run Payroll for Jan 15-30
      </button>
    </div>

  </div>
</template>