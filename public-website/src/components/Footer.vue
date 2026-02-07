<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-balai-dark text-white pt-24 pb-10 font-sans mt-24">
    
    <div class="container mx-auto px-6 md:px-12">
      
      <div class="flex flex-col md:flex-row justify-between gap-12 border-b border-white/10 pb-16">
        
        <div class="max-w-xs space-y-4">
          <img src="/images/logo.svg" alt="Balai Almeda" class="h-32 w-auto brightness-0 invert" />
          <p class="text-xs uppercase tracking-[0.3em] opacity-50 pl-1">
            Simple. Organic. Comfortable.
          </p>
        </div>

        <div class="flex gap-12 md:gap-24">
           <div class="space-y-6">
              <h3 class="font-serif text-lg text-balai-gold">Explore</h3>
              <nav class="flex flex-col space-y-3 text-sm opacity-70">
                 <RouterLink to="/" class="hover:text-balai-gold transition-colors">Home</RouterLink>
                 <RouterLink to="/rooms" class="hover:text-balai-gold transition-colors">Rooms</RouterLink>
                 <RouterLink to="/location" class="hover:text-balai-gold transition-colors">Location</RouterLink>
                 <RouterLink to="/contact" class="hover:text-balai-gold transition-colors">Contact</RouterLink>
              </nav>
           </div>

           <div class="space-y-6">
              <h3 class="font-serif text-lg text-balai-gold">Visit Us</h3>
              <div class="text-sm opacity-70 space-y-2">
                 <p>163 M. Almeda St., Brgy San Roque,<br>Pateros, Metro Manila</p>
                 <p class="pt-2">+63 995 420 6515</p>
                 <a href="mailto:balai.almeda@gmail.com" class="hover:text-balai-gold transition-colors underline decoration-balai-gold/30 underline-offset-4">
                    balai.almeda@gmail.com
                 </a>
              </div>
           </div>
        </div>

        <div class="max-w-xs space-y-6">
          <h3 class="font-serif text-lg text-balai-gold">Reserve Your Stay</h3>
          <p class="text-xs opacity-60 leading-relaxed">
             Ready for a pause? Book your sanctuary in the heart of the city today.
          </p>
          <RouterLink to="/availability" class="inline-block border border-balai-gold text-balai-gold px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-balai-gold hover:text-balai-dark transition-colors">
             Check Availability
          </RouterLink>
        </div>

      </div>

      <div class="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-wider opacity-40">
        <p>&copy; 2026 Balai Almeda. All rights reserved.</p>
        <div class="flex gap-6">
           <RouterLink to="/privacy" class="hover:text-white transition-colors">Privacy Policy</RouterLink>
           <RouterLink to="/cookies" class="hover:text-white transition-colors">Cookie Policy</RouterLink>
        </div>
      </div>

    </div>
  </footer>
</template>