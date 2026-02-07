<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

// Form data
const formData = ref({
  email: '',
  password: ''
})

// UI state
const isLoading = ref(false)

// ============================================================
// FEEDBACK MESSAGE STATE - YOU CAN MODIFY THE STYLING HERE
// ============================================================
const feedbackMessage = ref('')
const feedbackType = ref('') // 'success' or 'error'

// Login handler
const handleLogin = async () => {
  // Clear previous messages
  feedbackMessage.value = ''
  feedbackType.value = ''

  // Validate
  if (!formData.value.email || !formData.value.password) {
    feedbackMessage.value = 'Email and password are required'
    feedbackType.value = 'error'
    return
  }

  isLoading.value = true

  try {
    const response = await api.post('/auth/login', formData.value)

    if (response.ok && response.data.success) {
      // Store token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      feedbackMessage.value = response.data.message
      feedbackType.value = 'success'

      // Redirect to home after short delay
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      feedbackMessage.value = response.data.message
      feedbackType.value = 'error'
    }
  } catch (error) {
    console.error('Login error:', error)
    feedbackMessage.value = 'Connection error. Please check if the server is running.'
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-balai-bg flex items-center justify-center px-4 py-20 font-sans text-balai-dark">
    
    <div class="w-full max-w-md bg-white shadow-2xl p-8 md:p-12 border-t-4 border-balai-gold relative">
      
      <div class="text-center mb-10">
        <h1 class="font-serif text-3xl mb-2">Welcome Back</h1>
        <p class="text-gray-500 text-sm">Please enter your details to sign in.</p>
      </div>

      <!-- ============================================================ -->
      <!-- FEEDBACK MESSAGE DISPLAY - MODIFY STYLING HERE AS NEEDED -->
      <!-- ============================================================ -->
      <div v-if="feedbackMessage" 
           :class="[
             'mb-6 p-4 rounded text-sm text-center font-medium',
             feedbackType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
           ]">
        {{ feedbackMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="flex flex-col">
           <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
           <input 
             v-model="formData.email"
             type="email" 
             required
             class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
             placeholder="name@example.com" 
           />
        </div>

        <div class="flex flex-col">
           <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
              <a href="#" class="text-xs text-balai-gold hover:underline">Forgot password?</a>
           </div>
           <input 
             v-model="formData.password"
             type="password" 
             required
             class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
             placeholder="••••••••" 
           />
        </div>

        <button 
          type="submit"
          :disabled="isLoading"
          class="w-full bg-balai-dark text-white py-4 uppercase tracking-widest font-medium text-sm hover:bg-balai-gold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
           {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div class="relative my-8 text-center">
         <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
         </div>
         <span class="relative bg-white px-4 text-xs text-gray-400 uppercase tracking-widest">Or</span>
      </div>

      <div class="text-center text-sm">
         <span class="text-gray-600">Don't have an account? </span>
         <RouterLink to="/signup" class="font-bold text-balai-gold hover:text-balai-gold-dark underline">Create one</RouterLink>
      </div>

    </div>
  </main>
</template>