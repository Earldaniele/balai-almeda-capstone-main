import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './assets/main.css'

// Offline-first: auto-sync queue on reconnect
import { startAutoSync } from './utils/syncQueue.js'
startAutoSync()

// 🧹 One-time cleanup: delete stale API cache from old service worker
// This preserves the service worker itself (needed for PWA install bar)
if ('caches' in window) {
  caches.keys().then(names => {
    for (const name of names) {
      if (name.includes('api-cache')) {
        caches.delete(name)
        console.log('[Cache] Deleted stale API cache:', name)
      }
    }
  })
}

// 🔇 PRODUCTION MODE: Suppress verbose console output for staff
if (import.meta.env.PROD) {
  console.log = function() {}; // Mute verbose logs
  console.debug = function() {}; // Mute debug logs
  console.info = function() {}; // Mute info logs
  // ⚠️ Keep console.error and console.warn active for staff debugging
}

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// Initialize offline-first data store before mounting
import { useAppStore } from './stores/appStore.js'
const appStore = useAppStore()
appStore.initialize().then(() => {
  app.mount('#app')
})
