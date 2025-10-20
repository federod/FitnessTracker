import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import type { Exercise } from '@/types'

export const useExerciseStore = defineStore('exercise', () => {
  const exercises = ref<Exercise[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  // Get auth headers
  function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    }
  }

  // Fetch exercises for a specific date
  async function fetchExercisesByDate(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0]
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/.netlify/functions/exercise-entries?date=${targetDate}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch exercises')
      }

      exercises.value = data.exercises || []
      return data.exercises
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch exercises'
      console.error('Fetch exercises error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Fetch exercises for a date range (for weekly/monthly views)
  async function fetchExercisesByDateRange(startDate: string, endDate: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(
        `/.netlify/functions/exercise-entries?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch exercises')
      }

      return data.exercises || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch exercises'
      console.error('Fetch exercises error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Get today's exercises
  function getTodaysExercises(): Exercise[] {
    const today = new Date().toISOString().split('T')[0]
    return exercises.value.filter(exercise => exercise.date === today)
  }

  // Get today's total calories burned
  function getTodaysCaloriesBurned(): number {
    return getTodaysExercises().reduce(
      (total, exercise) => total + exercise.caloriesBurned,
      0
    )
  }

  // Get exercises by date
  function getExercisesByDate(date: string): Exercise[] {
    return exercises.value.filter(exercise => exercise.date === date)
  }

  // Add new exercise
  async function addExercise(exercise: {
    name: string
    type: Exercise['type']
    duration: number
    caloriesBurned: number
    date: string
    notes?: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/exercise-entries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(exercise),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add exercise')
      }

      // Refresh exercises for today
      await fetchExercisesByDate(exercise.date)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add exercise'
      console.error('Add exercise error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Remove exercise
  async function removeExercise(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/.netlify/functions/exercise-entries?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove exercise')
      }

      // Remove from local state
      exercises.value = exercises.value.filter(exercise => exercise.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove exercise'
      console.error('Remove exercise error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Legacy function - now just fetches from database
  async function loadFromLocalStorage() {
    await fetchExercisesByDate()
  }

  return {
    exercises,
    isLoading,
    error,
    getTodaysExercises,
    getTodaysCaloriesBurned,
    getExercisesByDate,
    fetchExercisesByDate,
    fetchExercisesByDateRange,
    addExercise,
    removeExercise,
    loadFromLocalStorage
  }
})
