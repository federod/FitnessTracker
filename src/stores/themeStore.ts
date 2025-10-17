import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('dark')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
    saveToLocalStorage()
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    applyTheme()
    saveToLocalStorage()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  function saveToLocalStorage() {
    localStorage.setItem('theme', theme.value)
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved && (saved === 'light' || saved === 'dark')) {
      theme.value = saved
    }
    applyTheme()
  }

  return {
    theme,
    toggleTheme,
    setTheme,
    loadFromLocalStorage
  }
})
