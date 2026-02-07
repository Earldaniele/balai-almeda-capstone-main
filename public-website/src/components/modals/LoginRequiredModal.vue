<script setup>
import { defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])
const router = useRouter()

const navigateToLogin = () => {
  emit('close')
  router.push('/login')
}

const navigateToSignup = () => {
  emit('close')
  router.push('/signup')
}
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    title="Account Required" 
    @close="$emit('close')"
  >
    <div class="text-center space-y-6">
       
       <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl">
          🔒
       </div>

       <div class="space-y-2">
          <p class="text-balai-dark font-serif text-xl">Please sign in to book.</p>
          <p class="text-gray-500 text-sm leading-relaxed px-4">
             To secure your reservation and manage your bookings, you need to be logged into your Balai Almeda account.
          </p>
       </div>

       <div class="flex flex-col gap-3 pt-2">
          
          <button 
             @click="navigateToLogin"
             class="w-full bg-balai-dark text-white py-3 text-sm font-medium uppercase tracking-widest hover:bg-balai-gold transition-colors shadow-md"
          >
             Log In
          </button>

          <button 
             @click="navigateToSignup"
             class="w-full border border-balai-dark text-balai-dark py-3 text-sm font-medium uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
             Create Account
          </button>

          <button 
             @click="$emit('close')"
             class="text-xs text-gray-400 hover:text-balai-dark mt-2"
          >
             Cancel and go back
          </button>

       </div>

    </div>
  </BaseModal>
</template>