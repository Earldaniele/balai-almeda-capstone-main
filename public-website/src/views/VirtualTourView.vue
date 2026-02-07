<script setup>
// VirtualTourView.vue
</script>

<template>
  <main class="text-balai-dark font-sans min-h-screen">

    <section class="relative h-[50vh] bg-balai-dark flex items-center justify-center text-white px-4">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="relative z-10 text-center max-w-3xl mx-auto">
        <h1 class="font-serif text-4xl md:text-5xl mb-4 tracking-wide">
          VIRTUAL TOUR
        </h1>
        <p class="text-sm md:text-lg uppercase tracking-widest opacity-90">
          Experience our spaces from anywhere
        </p>
      </div>
    </section>

    <section class="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <h2 class="font-serif text-3xl mb-4">Interactive Walkthrough</h2>
        <p class="text-gray-600">
          Click and drag to explore our lobby, rooms, and amenities. 
          Get a feel for the Balai Almeda atmosphere before you even step through the door.
        </p>
      </div>

      <div class="aspect-video bg-gray-200 shadow-2xl relative flex items-center justify-center group overflow-hidden border-4 border-white">
        <div class="text-center">
            <span class="text-6xl mb-4 block opacity-20">360°</span>
            <p class="uppercase tracking-widest font-bold text-gray-400">Tour Embed Goes Here</p>
        </div>
        
        <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 cursor-pointer">
           <button class="bg-balai-gold text-white px-8 py-3 uppercase tracking-widest font-medium hover:bg-balai-gold-dark transition-colors">
              Start Tour
           </button>
        </div>
      </div>
    </section>

    <section class="bg-white py-16 md:py-24">
      <div class="container mx-auto px-4">
        <h3 class="font-serif text-2xl mb-8 text-center">Tour Highlights</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gray-300 mb-4 overflow-hidden">
                 <div class="w-full h-full bg-balai-dark/10 group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h4 class="font-serif text-xl">The Lobby</h4>
              <p class="text-xs text-gray-500 uppercase tracking-widest mt-1">Ground Floor</p>
           </div>

           <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gray-300 mb-4 overflow-hidden">
                 <div class="w-full h-full bg-balai-dark/10 group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h4 class="font-serif text-xl">Executive Suite</h4>
              <p class="text-xs text-gray-500 uppercase tracking-widest mt-1">Second Floor</p>
           </div>

           <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gray-300 mb-4 overflow-hidden">
                 <div class="w-full h-full bg-balai-dark/10 group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h4 class="font-serif text-xl">Roof Deck</h4>
              <p class="text-xs text-gray-500 uppercase tracking-widest mt-1">Top Level</p>
           </div>
        </div>
      </div>
    </section>

  </main>
</template>