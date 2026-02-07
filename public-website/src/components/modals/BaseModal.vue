<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity"
      @click.self="close" 
    >
      
      <div class="bg-white w-full max-w-lg shadow-2xl relative animate-fade-in-up border-t-4 border-balai-gold">
        
        <div class="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 class="font-serif text-2xl text-balai-dark">{{ title }}</h3>
          
          <button @click="close" class="text-gray-400 hover:text-balai-gold text-2xl transition-colors">
            &times;
          </button>
        </div>

        <div class="p-8">
          <slot></slot>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Simple animation for smooth entry */
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>