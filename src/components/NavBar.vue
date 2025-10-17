<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <h1>Fitness Tracker</h1>
      </div>
      <div class="nav-right">
        <ul v-if="authStore.isAuthenticated()" class="nav-links">
          <li>
            <RouterLink to="/" :class="{ active: route.name === 'dashboard' }">
              Dashboard
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/food-log" :class="{ active: route.name === 'food-log' }">
              Food Log
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/exercise" :class="{ active: route.name === 'exercise' }">
              Exercise
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/recipes" :class="{ active: route.name === 'recipes' }">
              Recipes
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/profile" :class="{ active: route.name === 'profile' }">
              Profile
            </RouterLink>
          </li>
          <li>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </li>
        </ul>
        <ThemeToggle />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: var(--bg-elevated);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  color: var(--text-primary);
  padding: 0.75rem 0;
  box-shadow: 0 1px 0 var(--separator);
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 0.5px solid var(--separator);
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
}

.nav-brand h1 {
  font-size: 22px;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  align-items: center;
}

.nav-links li {
  margin: 0;
  display: flex;
  align-items: center;
}

.nav-links a,
.logout-btn {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  transition: all 0.15s ease;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: -0.08px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  line-height: 1;
}

.nav-links a:hover,
.logout-btn:hover {
  background: var(--fill-tertiary);
  color: var(--text-primary);
}

.nav-links a:active,
.logout-btn:active {
  opacity: 0.5;
  transform: scale(0.98);
}

.nav-links a.active {
  background: var(--ios-blue);
  color: white;
  font-weight: 600;
}

.logout-btn {
  color: var(--ios-red);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem 0;
  }

  .nav-brand h1 {
    font-size: 20px;
  }

  .nav-links {
    display: none;
  }
}
</style>
