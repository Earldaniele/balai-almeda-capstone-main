<template>
  <div class="min-h-screen bg-gray-50 pt-28 pb-12 px-6 font-sans text-balai-dark">
    <div class="max-w-6xl mx-auto">
      
      <h1 class="text-3xl md:text-4xl font-serif mb-8">Account Settings</h1>
      
      <div v-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-1">
          <div class="bg-white shadow-lg shadow-gray-200/50 p-8 text-center border border-gray-100 top-28">
            <div class="w-24 h-24 rounded-full bg-balai-dark text-white flex items-center justify-center text-3xl font-serif mx-auto mb-4 shadow-md">
              {{ user.firstName?.charAt(0) }}
            </div>
            
            <h2 class="font-serif text-2xl mb-1">{{ user.firstName }} {{ user.lastName }}</h2>
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">{{ user.role }} Account</p>
            
            <div class="border-t border-gray-100 pt-6 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Member since</span>
                <span class="font-medium">{{ userStats.memberSince || '...' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Bookings</span>
                <span class="font-medium">{{ userStats.totalBookings || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          
          <div class="bg-white shadow-md shadow-gray-200/40 p-8 border border-gray-100">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-serif text-xl">Personal Information</h3>
              <button 
                @click="isEditing = !isEditing"
                class="text-[10px] font-bold uppercase tracking-widest text-balai-gold hover:text-balai-dark transition-colors"
              >
                {{ isEditing ? 'Cancel Edit' : 'Edit Details' }}
              </button>
            </div>

            <!-- Success/Error Message -->
            <div v-if="profileMessage.text" class="mb-6 p-4 border" :class="profileMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'">
              <p class="text-sm">{{ profileMessage.text }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</label>
                <div v-if="!isEditing" class="text-base font-medium border-b border-transparent py-2">{{ user.firstName }}</div>
                <input v-else type="text" v-model="form.firstName" maxlength="50" class="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-balai-gold bg-gray-50 px-2 transition-colors" />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name</label>
                <div v-if="!isEditing" class="text-base font-medium border-b border-transparent py-2">{{ user.lastName }}</div>
                <input v-else type="text" v-model="form.lastName" maxlength="50" class="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-balai-gold bg-gray-50 px-2 transition-colors" />
              </div>

              <div class="space-y-1 md:col-span-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <div v-if="!isEditing" class="text-base font-medium border-b border-transparent py-2">{{ user.email }}</div>
                <input v-else type="email" v-model="form.email" maxlength="100" class="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-balai-gold bg-gray-50 px-2 transition-colors" />
              </div>

              <div class="space-y-1 md:col-span-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                <div v-if="!isEditing" class="text-base font-medium border-b border-transparent py-2">{{ user.phone || 'No phone number added' }}</div>
                <input v-else type="tel" v-model="form.phone" maxlength="13" pattern="(09|\+639|639)\d{9}" placeholder="09171234567 or +639171234567" class="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-balai-gold bg-gray-50 px-2 transition-colors" />
              </div>
            </div>

            <div v-if="isEditing" class="mt-8 flex justify-end gap-4 animate-fade-in">
              <button @click="isEditing = false" class="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-balai-dark transition-colors">Cancel</button>
              <button 
                @click="saveProfile" 
                :disabled="isSavingProfile"
                class="px-6 py-3 bg-balai-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSavingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <div class="bg-white shadow-md shadow-gray-200/40 p-8 border border-gray-100">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-serif text-xl">Security</h3>
            </div>

            <!-- Success/Error Message -->
            <div v-if="passwordMessage.text" class="mb-6 p-4 border" :class="passwordMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'">
              <p class="text-sm">{{ passwordMessage.text }}</p>
            </div>

            <div v-if="!isChangingPassword">
               <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                  <div class="flex items-center gap-3">
                    <LockClosedIcon class="w-5 h-5 text-gray-600" />
                    <div>
                      <p class="text-sm font-bold text-gray-700">Password</p>
                    </div>
                  </div>
                  <button 
                    @click="isChangingPassword = true"
                    class="text-[10px] font-bold uppercase tracking-widest text-balai-dark hover:text-balai-gold transition-colors border border-gray-300 px-4 py-2 hover:border-balai-gold"
                  >
                    Change
                  </button>
               </div>
            </div>

            <div v-else class="space-y-4 animate-fade-in">
              <div class="space-y-1">
                <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Password</label>
                <input 
                  v-model="passwordForm.currentPassword" 
                  type="password"
                  maxlength="64" 
                  class="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">New Password</label>
                  <input 
                    v-model="passwordForm.newPassword" 
                    type="password"
                    minlength="8"
                    maxlength="64" 
                    class="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
                  />
                  <p class="text-xs text-gray-400 mt-1">Must be 8-64 characters</p>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Confirm Password</label>
                  <input 
                    v-model="passwordForm.confirmPassword" 
                    type="password"
                    minlength="8"
                    maxlength="64" 
                    class="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-balai-gold transition-colors" 
                  />
                </div>
              </div>
              <div class="flex justify-end gap-4 pt-4">
                <button @click="isChangingPassword = false" class="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-balai-dark transition-colors">Cancel</button>
                <button 
                  @click="changePassword"
                  :disabled="isSavingPassword"
                  class="px-6 py-3 bg-balai-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isSavingPassword ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div v-else class="text-center py-20 bg-white shadow-sm border border-gray-100">
        <p class="text-gray-600 mb-6 font-serif text-lg">Please log in to manage your account.</p>
        <RouterLink 
          to="/login" 
          class="inline-block bg-balai-dark text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-balai-gold transition-colors"
        >
          Log In
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getUser, getToken, isAuthenticated } from '@/utils/auth'
import api from '@/services/api'
import { LockClosedIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const user = ref(null)

// User stats
const userStats = ref({
  memberSince: null,
  totalBookings: 0
})

// UI States
const isEditing = ref(false)
const isChangingPassword = ref(false)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const profileMessage = ref({ type: '', text: '' })
const passwordMessage = ref({ type: '', text: '' })

// Form State
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

// Password Form State
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Phone number validation regex for PH mobile numbers
const phoneRegex = /^(09|\+639|639)\d{9}$/

// Validate phone number format
const validatePhone = (phone) => {
  if (!phone) return true // Phone is optional in profile
  // Remove all spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, '')
  return phoneRegex.test(cleanPhone)
}

// Fetch user stats (member since and total bookings)
const fetchUserStats = async () => {
  try {
    const response = await api.get('/auth/stats', true)

    if (response.ok && response.data.success) {
      // ✅ DEFENSIVE CODING: Validate stats object structure
      if (!response.data.stats || typeof response.data.stats !== 'object') {
        console.warn('⚠️ API Response Validation Failed: Expected stats object, got:', typeof response.data.stats)
        userStats.value = {
          memberSince: new Date().toISOString(),
          totalBookings: 0
        }
        return
      }

      // Map with safe property access
      userStats.value = {
        memberSince: response.data.stats.memberSince ?? new Date().toISOString(),
        totalBookings: response.data.stats.totalBookings ?? 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    // Provide safe defaults on error
    userStats.value = {
      memberSince: new Date().toISOString(),
      totalBookings: 0
    }
  }
}

// Save profile changes
const saveProfile = async () => {
  isSavingProfile.value = true
  profileMessage.value = { type: '', text: '' }

  // Trim whitespace from names
  form.firstName = form.firstName.trim()
  form.lastName = form.lastName.trim()
  form.phone = form.phone.trim()

  // Validate required fields
  if (!form.firstName || !form.lastName || !form.email) {
    profileMessage.value = { type: 'error', text: 'First name, last name, and email are required' }
    isSavingProfile.value = false
    return
  }

  // Validate phone number if provided
  if (form.phone && !validatePhone(form.phone)) {
    profileMessage.value = { type: 'error', text: 'Please enter a valid PH mobile number (e.g., 0917... or +639...)' }
    isSavingProfile.value = false
    return
  }

  try {
    const response = await api.put('/auth/profile', {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone
    }, true)

    if (response.ok && response.data.success) {
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.data.user))
      user.value = response.data.user
      
      // Update form with new values
      form.firstName = response.data.user.firstName
      form.lastName = response.data.user.lastName
      form.email = response.data.user.email
      form.phone = response.data.user.phone

      profileMessage.value = { type: 'success', text: 'Profile updated successfully!' }
      isEditing.value = false

      // Clear message after 3 seconds
      setTimeout(() => {
        profileMessage.value = { type: '', text: '' }
      }, 3000)
    } else {
      profileMessage.value = { type: 'error', text: response.data.message || 'Failed to update profile' }
    }
  } catch (error) {
    console.error('Profile update error:', error)
    profileMessage.value = { type: 'error', text: 'Network error. Please try again.' }
  } finally {
    isSavingProfile.value = false
  }
}

// Change password
const changePassword = async () => {
  // Validate passwords match
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordMessage.value = { type: 'error', text: 'New passwords do not match' }
    return
  }

  // Validate password length (minimum 8, maximum 64)
  if (passwordForm.newPassword.length < 8) {
    passwordMessage.value = { type: 'error', text: 'Password must be at least 8 characters' }
    return
  }

  if (passwordForm.newPassword.length > 64) {
    passwordMessage.value = { type: 'error', text: 'Password must not exceed 64 characters' }
    return
  }

  isSavingPassword.value = true
  passwordMessage.value = { type: '', text: '' }

  try {
    const response = await api.put('/auth/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    }, true)

    if (response.ok && response.data.success) {
      passwordMessage.value = { type: 'success', text: 'Password changed successfully!' }
      isChangingPassword.value = false
      
      // Reset form
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''

      // Clear message after 3 seconds
      setTimeout(() => {
        passwordMessage.value = { type: '', text: '' }
      }, 3000)
    } else {
      passwordMessage.value = { type: 'error', text: response.data.message || 'Failed to change password' }
    }
  } catch (error) {
    console.error('Password change error:', error)
    passwordMessage.value = { type: 'error', text: 'Network error. Please try again.' }
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
  } else {
    user.value = getUser()
    // Pre-fill form
    if (user.value) {
      form.firstName = user.value.firstName
      form.lastName = user.value.lastName
      form.email = user.value.email
      form.phone = user.value.phone || ''
    }
    // Fetch user statistics
    fetchUserStats()
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>