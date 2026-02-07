<script setup>
// LocationView.vue
</script>

<template>
  <main class="text-balai-dark font-sans min-h-screen">

    <section class="relative h-[50vh] bg-balai-dark flex items-center justify-center text-white px-4">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="relative z-10 text-center max-w-3xl mx-auto">
        <h1 class="font-serif text-4xl md:text-5xl mb-4 tracking-wide">
          OUR LOCATION
        </h1>
        <p class="text-sm md:text-lg uppercase tracking-widest opacity-90">
          The heart of Pateros
        </p>
      </div>
    </section>

    <section class="container mx-auto px-4 md:px-6 py-16 md:py-24">
       <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div class="space-y-8">
             <div>
                <h2 class="font-serif text-3xl mb-4">Getting Here</h2>
                <p class="text-gray-600 leading-relaxed mb-6">
                   Located conveniently in San Roque, we are just a few minutes away from the bustling districts of BGC and Makati.
                </p>
                <div class="bg-white p-6 shadow-md border-l-4 border-balai-gold">
                   <h3 class="font-bold uppercase text-xs tracking-widest text-balai-gold-dark mb-2">Address</h3>
                   <p class="leading-relaxed">
                      163 M. Almeda St., Barangay San Roque,<br>
                      Pateros, Metro Manila 1620
                   </p>
                </div>
             </div>
             
             <div>
                <h3 class="font-bold uppercase text-xs tracking-widest text-balai-gold-dark mb-4">Distance From</h3>
                <ul class="space-y-3 text-sm">
                   <li class="flex justify-between border-b border-gray-200 pb-2">
                      <span>BGC High Street</span>
                      <span class="font-bold">3.5 km</span>
                   </li>
                   <li class="flex justify-between border-b border-gray-200 pb-2">
                      <span>Ninoy Aquino Airport</span>
                      <span class="font-bold">12 km</span>
                   </li>
                   <li class="flex justify-between border-b border-gray-200 pb-2">
                      <span>SM Aura Premier</span>
                      <span class="font-bold">4.0 km</span>
                   </li>
                </ul>
             </div>
          </div>

          <div class="lg:col-span-2 min-h-[400px] bg-gray-200 relative shadow-xl">
             <div class="absolute inset-0 flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest">
                Google Map Embed
             </div>
          </div>

       </div>
    </section>

    <section class="bg-white py-16 md:py-24">
       <div class="container mx-auto px-4">
          <h2 class="font-serif text-3xl mb-12 text-center">Neighborhood Guide</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div class="text-center">
                <div class="w-full h-40 bg-gray-100 mb-4"></div>
                <h4 class="font-serif text-lg">Local Dining</h4>
                <p class="text-xs text-gray-500">3 mins walk</p>
             </div>
             <div class="text-center">
                <div class="w-full h-40 bg-gray-100 mb-4"></div>
                <h4 class="font-serif text-lg">San Roque Church</h4>
                <p class="text-xs text-gray-500">5 mins walk</p>
             </div>
             <div class="text-center">
                <div class="w-full h-40 bg-gray-100 mb-4"></div>
                <h4 class="font-serif text-lg">Pateros Park</h4>
                <p class="text-xs text-gray-500">10 mins walk</p>
             </div>
             <div class="text-center">
                <div class="w-full h-40 bg-gray-100 mb-4"></div>
                <h4 class="font-serif text-lg">River Ferry</h4>
                <p class="text-xs text-gray-500">15 mins walk</p>
             </div>
          </div>
       </div>
    </section>

  </main>
</template>