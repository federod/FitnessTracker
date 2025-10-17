<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.error || 'Login failed'
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Welcome Back</h1>
        <p class="subtitle">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="btn-primary"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Don't have an account?
          <RouterLink to="/signup" class="link">Sign up</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  padding-bottom: 80px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 0.5rem;
  letter-spacing: -0.3px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 15px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.08px;
}

.form-group input {
  background: var(--bg-tertiary);
  border: 0.5px solid var(--separator);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 17px;
  color: var(--text-primary);
  letter-spacing: -0.41px;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--ios-blue);
  background: var(--bg-primary);
}

.form-group input::placeholder {
  color: var(--text-tertiary);
}

.error-message {
  background: rgba(255, 59, 48, 0.1);
  border: 0.5px solid var(--ios-red);
  color: var(--ios-red);
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 15px;
  text-align: center;
}

.btn-primary {
  background: var(--ios-blue);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.41px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover {
  opacity: 0.8;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 0.5px solid var(--separator);
}

.auth-footer p {
  font-size: 15px;
  color: var(--text-secondary);
}

.link {
  color: var(--ios-blue);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  opacity: 0.8;
}
</style>
