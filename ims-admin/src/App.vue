<script setup>
import PwaInstallBar from './components/PwaInstallBar.vue'
import OfflineBanner from './components/OfflineBanner.vue'
</script>

<template>
  <OfflineBanner />
  <router-view />
  <PwaInstallBar />
</template>

<style scoped></style>
