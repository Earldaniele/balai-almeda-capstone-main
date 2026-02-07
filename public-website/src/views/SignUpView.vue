<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

// Form data
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: ''
})

// UI state
const isLoading = ref(false)

// ============================================================
// FEEDBACK MESSAGE STATE - YOU CAN MODIFY THE STYLING HERE
// ============================================================
const feedbackMessage = ref('')
const feedbackType = ref('') // 'success' or 'error'

// Phone number validation regex for PH mobile numbers
const phoneRegex = /^(09|\+639|639)\d{9}$/

// Validate phone number format
const validatePhone = (phone) => {
  // Remove all spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, '')
  return phoneRegex.test(cleanPhone)
}

// Signup handler
const handleSignup = async () => {
  // Clear previous messages
  feedbackMessage.value = ''
  feedbackType.value = ''

  // Trim whitespace from names
  formData.value.firstName = formData.value.firstName.trim()
  formData.value.lastName = formData.value.lastName.trim()

  // Validate required fields
  if (!formData.value.firstName || !formData.value.lastName || !formData.value.email || !formData.value.phone || !formData.value.password) {
    feedbackMessage.value = 'All fields are required'
    feedbackType.value = 'error'
    return
  }

  // Phone number validation
  if (!validatePhone(formData.value.phone)) {
    feedbackMessage.value = 'Please enter a valid PH mobile number (e.g., 0917... or 63917...)'
    feedbackType.value = 'error'
    return
  }

  // Password length check
  if (formData.value.password.length < 8) {
    feedbackMessage.value = 'Password must be at least 8 characters'
    feedbackType.value = 'error'
    return
  }

  if (formData.value.password.length > 64) {
    feedbackMessage.value = 'Password must not exceed 64 characters'
    feedbackType.value = 'error'
    return
  }

  isLoading.value = true

  try {
    const response = await api.post('/auth/signup', formData.value)

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
    console.error('Signup error:', error)
    feedbackMessage.value = 'Connection error. Please check if the server is running.'
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-balai-bg flex items-center justify-center px-4 py-20 font-sans text-balai-dark">
    
    <div class="w-full max-w-lg bg-white shadow-2xl p-8 md:p-12 border-t-4 border-balai-gold">
      
      <div class="text-center mb-10">
        <h1 class="font-serif text-3xl mb-2">Create Account</h1>
        <p class="text-gray-500 text-sm">Join us to book your stay at Balai Almeda.</p>
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

      <form @submit.prevent="handleSignup" class="space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div class="flex flex-col">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
              <input 
                v-model="formData.firstName"
                type="text" 
                required
                maxlength="50"
                class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
              />
           </div>
           <div class="flex flex-col">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
              <input 
                v-model="formData.lastName"
                type="text" 
                required
                maxlength="50"
                class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
              />
           </div>
        </div>

        <div class="flex flex-col">
           <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
           <input 
             v-model="formData.email"
             type="email" 
             required
             maxlength="100"
             class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
           />
        </div>

        <div class="flex flex-col">
           <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
           <input 
             v-model="formData.phone"
             type="tel" 
             required
             maxlength="13"
             pattern="(09|\+639|639)\d{9}"
             class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
             placeholder="09171234567 or +639171234567" 
           />
           <p class="text-xs text-gray-400 mt-1">PH mobile number (e.g., 0917... or +639...)</p>
        </div>

        <div class="flex flex-col">
           <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Password</label>
           <input 
             v-model="formData.password"
             type="password" 
             required
             minlength="8"
             maxlength="64"
             class="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
           />
           <p class="text-xs text-gray-400 mt-1">Must be 8-64 characters</p>
        </div>

        <button 
          type="submit"
          :disabled="isLoading"
          class="w-full bg-balai-dark text-white py-4 uppercase tracking-widest font-medium text-sm hover:bg-balai-gold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
           {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="text-center text-sm mt-8">
         <span class="text-gray-600">Already have an account? </span>
         <RouterLink to="/login" class="font-bold text-balai-gold hover:text-balai-gold-dark underline">Sign in</RouterLink>
      </div>

    </div>
  </main>
</template>