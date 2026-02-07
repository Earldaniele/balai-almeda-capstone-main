/**
 * useOnlineStatus.js — Reactive composable for detecting online/offline state
 * 
 * Usage:
 *   const { isOnline, wasOffline } = useOnlineStatus()
 *   // isOnline.value === true/false (reactive)
 *   // wasOffline.value === true after first offline→online transition (triggers sync)
 */

import { ref, onMounted, onUnmounted } from 'vue'

// Shared singleton state so all components share the same reactive ref
const isOnline = ref(navigator.onLine)
const wasOffline = ref(false)
const listeners = new Set()

function handleOnline() {
  isOnline.value = true
  // If we were offline, flag it so sync can trigger
  if (wasOffline.value === false) {
    wasOffline.value = true
  }
}

function handleOffline() {
  isOnline.value = false
}

// Initialize global listeners once
let initialized = false
function initGlobalListeners() {
  if (initialized) return
  initialized = true
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

/**
 * Composable hook for components
 */
export function useOnlineStatus() {
  onMounted(() => {
    initGlobalListeners()
    isOnline.value = navigator.onLine
  })

  return {
    isOnline,
    wasOffline,
  }
}

/**
 * Non-composable check (for use outside Vue components, e.g., in stores/utils)
 */
export function checkOnline() {
  return navigator.onLine
}
