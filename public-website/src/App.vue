<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen bg-balai-bg font-sans text-balai-dark">
    <!-- Toast Notification System -->
    <Toaster position="top-center" :duration="4000" richColors />

    <NavBar />

    <div class="flex-grow">
      <RouterView />
    </div>

    <Footer />
  </div>

  <!--<div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
       <div class="flex flex-col">
          <span class="text-xs text-gray-500 font-medium uppercase tracking-wide">Starts at</span>
          <span class="text-balai-dark font-serif font-bold text-lg">₱2,500<span class="text-xs font-sans font-normal text-gray-400">/night</span></span>
       </div>
       <RouterLink to="/rooms" class="bg-balai-gold text-white px-6 py-3 text-sm font-medium tracking-wider uppercase rounded shadow-sm">
          Book Now
       </RouterLink>
    </div>-->
</template>

<style scoped>
</style>