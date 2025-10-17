<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'dashboard', path: '/', icon: '📊', label: 'Home' },
  { name: 'food-log', path: '/food-log', icon: '🍽️', label: 'Food' },
  { name: 'exercise', path: '/exercise', icon: '💪', label: 'Exercise' },
  { name: 'profile', path: '/profile', icon: '👤', label: 'Profile' }
]
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ active: route.name === item.name }"
    >
      <div class="nav-icon">{{ item.icon }}</div>
      <div class="nav-label">{{ item.label }}</div>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--bg-elevated);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top: 0.5px solid var(--separator);
  box-shadow: 0 -1px 0 var(--separator);
  padding: 0.5rem 0;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--text-tertiary);
  flex: 1;
  padding: 0.375rem;
  transition: all var(--transition-fast);
  position: relative;
  min-height: 50px;
}

.nav-item.active {
  color: var(--ios-blue);
}

.nav-item:active {
  opacity: 0.4;
  transform: scale(0.96);
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 0.125rem;
  transition: all var(--transition-fast);
  line-height: 1;
}

.nav-item.active .nav-icon {
  transform: translateY(-2px);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  transition: all var(--transition-fast);
  letter-spacing: -0.2px;
}

.nav-item.active .nav-label {
  font-weight: 600;
}

@media (min-width: 769px) {
  .bottom-nav {
    display: none;
  }
}

/* Safe area for devices with notches */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-nav {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}
</style>
