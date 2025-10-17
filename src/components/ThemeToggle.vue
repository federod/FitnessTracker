<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
</script>

<template>
  <button @click="themeStore.toggleTheme" class="theme-toggle" aria-label="Toggle theme">
    <span v-if="themeStore.theme === 'light'" class="icon">🌙</span>
    <span v-else class="icon">☀️</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  background: var(--fill-tertiary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0.5px solid var(--separator);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--fill-secondary);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.icon {
  font-size: 20px;
  line-height: 1;
}
</style>
