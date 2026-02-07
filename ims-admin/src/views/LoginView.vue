<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore.js'

const router = useRouter()
const appStore = useAppStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await appStore.loginUser(email.value, password.value)
    if (result.success) {
      router.push('/admin/dashboard')
    } else {
      errorMsg.value = result.message || 'Login failed'
    }
  } catch (err) {
    errorMsg.value = err.message || 'Unable to connect to server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-[Inter]">
    
    <div class="mb-8 text-center">
      <div class="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto shadow-xl">B</div>
      <h1 class="text-2xl font-bold text-gray-900 mt-4 tracking-tight">Balai Almeda</h1>
      <p class="text-gray-500 text-sm mt-1">Internal Management System</p>
    </div>

    <div class="bg-white w-full max-w-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
      <form @submit.prevent="handleLogin" class="space-y-5">
        
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Work Email</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="staff@balaialmeda.com"
            class="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            required
          >
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            required
          >
        </div>

        <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-lg shadow-lg shadow-gray-900/10 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
        >
          <span v-if="!loading">Sign In</span>
          <svg v-else class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>

      </form>
    </div>

    <p class="mt-8 text-xs text-gray-400">
      Authorized personnel only. Access is monitored.
    </p>
  </div>
</template>