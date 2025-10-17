import { defineStore } from 'pinia'
import { ref } from 'vue'

interface User {
  id: number
  email: string
  name: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Initialize from localStorage
  function init() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  // Save to localStorage
  function saveToStorage() {
    if (token.value && user.value) {
      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  // Clear from localStorage
  function clearStorage() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // Sign up
  async function signup(email: string, password: string, name: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/auth-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      user.value = data.user
      token.value = data.token
      saveToStorage()

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Signup failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Login
  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      user.value = data.user
      token.value = data.token
      saveToStorage()

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  function logout() {
    user.value = null
    token.value = null
    clearStorage()
  }

  // Get current user from API
  async function fetchCurrentUser() {
    if (!token.value) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/auth-me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user')
      }

      user.value = data.user
      saveToStorage()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user'
      // If token is invalid, logout
      logout()
    } finally {
      isLoading.value = false
    }
  }

  // Update user name
  async function updateName(name: string) {
    if (!token.value) return { success: false, error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/user-update-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name')
      }

      user.value = data.user
      saveToStorage()

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update name'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token.value && !!user.value
  }

  // Initialize on store creation
  init()

  return {
    user,
    token,
    isLoading,
    error,
    signup,
    login,
    logout,
    fetchCurrentUser,
    updateName,
    isAuthenticated,
  }
})
