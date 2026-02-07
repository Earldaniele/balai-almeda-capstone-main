<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useOnlineStatus } from '../composables/useOnlineStatus.js'
import { useAppStore } from '../stores/appStore.js'

const { isOnline } = useOnlineStatus()
const appStore = useAppStore()

const showSyncSuccess = ref(false)

async function handleSyncComplete(event) {
  const { synced } = event.detail
  if (synced > 0) {
    showSyncSuccess.value = true
    // Refresh all data from server so UI updates without manual page refresh
    await Promise.all([
      appStore.refreshPendingCount(),
      appStore.fetchAllFromServer(),
    ])
    setTimeout(() => {
      showSyncSuccess.value = false
    }, 4000)
  }
}

onMounted(() => {
  window.addEventListener('sync-complete', handleSyncComplete)
})

onUnmounted(() => {
  window.removeEventListener('sync-complete', handleSyncComplete)
})
</script>

<template>
  <!-- Offline Banner -->
  <Transition name="slide-down">
    <div v-if="!isOnline" class="offline-banner">
      <div class="offline-content">
        <div class="offline-icon">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
        <span class="offline-text">
          <strong>You're offline</strong> — Changes are saved locally and will sync when you reconnect.
        </span>
        <span v-if="appStore.pendingSyncCount > 0" class="pending-badge">
          {{ appStore.pendingSyncCount }} pending
        </span>
      </div>
    </div>
  </Transition>

  <!-- Sync Success Toast -->
  <Transition name="slide-down">
    <div v-if="showSyncSuccess" class="sync-toast">
      <div class="sync-toast-content">
        <svg class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>All changes synced successfully!</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: #f1f5f9;
  padding: 10px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.offline-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.offline-icon {
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #f87171;
}

.offline-text strong {
  color: #fbbf24;
}

.pending-badge {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 100px;
  white-space: nowrap;
}

.sync-toast {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 9999;
  background: #065f46;
  color: #d1fae5;
  padding: 12px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.sync-toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
