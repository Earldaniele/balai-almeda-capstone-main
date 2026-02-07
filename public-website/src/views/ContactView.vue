<script setup>
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/vue/24/outline'

// ContactView.vue
</script>

<template>
  <main class="text-balai-dark font-sans min-h-screen bg-balai-bg">

    <section class="relative h-[50vh] bg-balai-dark flex items-center justify-center text-white px-4">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="relative z-10 text-center max-w-3xl mx-auto">
        <h1 class="font-serif text-4xl md:text-5xl mb-4 tracking-wide">
          CONTACT US
        </h1>
        <p class="text-sm md:text-lg uppercase tracking-widest opacity-90">
          We are here to assist you
        </p>
      </div>
    </section>

    <section class="container mx-auto px-4 md:px-6 py-16 md:py-24">
       
       <div class="bg-white shadow-2xl p-8 md:p-16 border-t-4 border-balai-gold">
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
             
             <div class="space-y-12">
                <div>
                   <h2 class="font-serif text-3xl mb-6">Get in Touch</h2>
                   <p class="text-gray-600 leading-relaxed">
                      Whether you have a question about room availability, event bookings, or special requests, our front desk is ready to help.
                   </p>
                </div>

                <div class="space-y-8">
                   <div class="flex items-start gap-6 group">
                      <div class="w-12 h-12 bg-balai-bg flex shrink-0 items-center justify-center text-balai-gold-dark rounded-full">
                        <PhoneIcon class="w-6 h-6" />
                      </div>
                      <div>
                         <h4 class="font-bold uppercase text-xs tracking-widest text-gray-500 mb-1">Phone</h4>
                         <p class="text-2xl font-serif text-balai-dark">+63 995 420 6515</p>
                         <p class="text-xs text-gray-400 mt-1">Available Daily, 8AM - 8PM</p>
                      </div>
                   </div>

                   <a href="mailto:balai.almeda@gmail.com" class="flex items-start gap-6 group">
                      <div class="w-12 h-12 bg-balai-bg flex shrink-0 items-center justify-center text-balai-gold-dark rounded-full">
                        <EnvelopeIcon class="w-6 h-6" />
                      </div>
                      <div>
                         <h4 class="font-bold uppercase text-xs tracking-widest text-gray-500 mb-1">Email</h4>
                         <p class="text-xl font-bold text-balai-dark underline decoration-balai-gold/30 hover:decoration-balai-gold transition-all">balaialmeda@gmail.com</p>
                         <p class="text-xs text-gray-400 mt-1">Click to send email</p>
                      </div>
                   </a>

                   <div class="flex items-start gap-6 group">
                      <div class="w-12 h-12 bg-balai-bg flex shrink-0 items-center justify-center text-balai-gold-dark rounded-full">
                        <MapPinIcon class="w-6 h-6" />
                      </div>
                      <div>
                         <h4 class="font-bold uppercase text-xs tracking-widest text-gray-500 mb-1">Location</h4>
                         <p class="text-lg text-balai-dark leading-relaxed">163 M. Almeda St., Barangay San Roque,<br>Pateros, Metro Manila</p>
                      </div>
                   </div>
                </div>
             </div>

             <div class="lg:border-l lg:border-gray-100 lg:pl-16">
                <h3 class="font-serif text-2xl mb-8">Frequently Asked</h3>
                
                <div class="space-y-6">
                   <details class="group">
                      <summary class="font-bold cursor-pointer list-none flex justify-between items-center text-balai-dark hover:text-balai-gold transition-colors">
                         Is there parking available?
                         <span class="group-open:rotate-180 transition-transform">↓</span>
                      </summary>
                      <p class="text-gray-600 mt-3 text-sm leading-relaxed pl-4 border-l-2 border-balai-gold">
                         Yes, we have limited parking spaces available for guests on a first-come, first-served basis.
                      </p>
                   </details>
                   
                   <details class="group">
                      <summary class="font-bold cursor-pointer list-none flex justify-between items-center text-balai-dark hover:text-balai-gold transition-colors">
                         Do you allow pets?
                         <span class="group-open:rotate-180 transition-transform">↓</span>
                      </summary>
                      <p class="text-gray-600 mt-3 text-sm leading-relaxed pl-4 border-l-2 border-balai-gold">
                         We currently do not allow pets in the guest rooms to ensure the comfort of all our guests.
                      </p>
                   </details>

                   <details class="group">
                      <summary class="font-bold cursor-pointer list-none flex justify-between items-center text-balai-dark hover:text-balai-gold transition-colors">
                         What time is check-in?
                         <span class="group-open:rotate-180 transition-transform">↓</span>
                      </summary>
                      <p class="text-gray-600 mt-3 text-sm leading-relaxed pl-4 border-l-2 border-balai-gold">
                         Standard check-in is at 2:00 PM and check-out is at 12:00 PM.
                      </p>
                   </details>
                </div>


             </div>
          </div>

       </div>
    </section>

  </main>
</template>