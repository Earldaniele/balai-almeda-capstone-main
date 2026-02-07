import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Import local fonts
import '@fontsource/lato/300.css'  // Light
import '@fontsource/lato/400.css'  // Regular
import '@fontsource/lato/700.css'  // Bold
import '@fontsource/prata/400.css' // Regular

// Import vue-sonner for toast notifications
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css' // Import styles

import App from './App.vue'
import router from './router'

// 🔇 PRODUCTION MODE: Suppress verbose console output for guests
if (import.meta.env.PROD) {
  console.log = function() {}; // Mute verbose logs
  console.debug = function() {}; // Mute debug logs
  console.info = function() {}; // Mute info logs
  // ⚠️ Keep console.error and console.warn active for critical UI debugging
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Register Toaster component globally
app.component('Toaster', Toaster)

app.mount('#app')
