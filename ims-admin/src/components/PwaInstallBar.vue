<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const showInstallBar = ref(false)
const deferredPrompt = ref(null)

function handleBeforeInstallPrompt(e) {
  e.preventDefault()
  deferredPrompt.value = e
  showInstallBar.value = true
}

async function installApp() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    showInstallBar.value = false
  }
  deferredPrompt.value = null
}

function dismissBar() {
  showInstallBar.value = false
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', () => {
    showInstallBar.value = false
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="showInstallBar" class="install-bar">
      <div class="install-bar-content">
        <div class="install-bar-left">
          <img src="/icons/icon-192x192.svg" alt="BA Admin" class="install-bar-icon" />
          <div class="install-bar-text">
            <strong>Balai Almeda Admin</strong>
            <span>Install app for a better experience</span>
          </div>
        </div>
        <div class="install-bar-actions">
          <button class="install-btn" @click="installApp">Install</button>
          <button class="dismiss-btn" @click="dismissBar">&times;</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.install-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #1e293b;
  color: #f8fafc;
  padding: 12px 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

.install-bar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.install-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.install-bar-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.install-bar-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.install-bar-text strong {
  font-size: 14px;
  font-weight: 600;
}

.install-bar-text span {
  font-size: 12px;
  color: #94a3b8;
}

.install-bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.install-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.install-btn:hover {
  background-color: #2563eb;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}

.dismiss-btn:hover {
  color: #f8fafc;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
