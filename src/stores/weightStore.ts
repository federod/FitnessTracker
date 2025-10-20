import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import { getLocalDateString } from '@/utils/date'

export interface WeightEntry {
  id: number
  userId: number
  weight: number
  date: string
  notes?: string | null
  createdAt: string
}

export const useWeightStore = defineStore('weight', () => {
  const weightEntries = ref<WeightEntry[]>([])
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

  // Fetch weight history
  async function fetchWeightHistory(limit = 30) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/.netlify/functions/weight-entries?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weight history')
      }

      weightEntries.value = data.entries || []
      return data.entries
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch weight history'
      console.error('Fetch weight history error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Fetch weight entries for a date range
  async function fetchWeightByDateRange(startDate: string, endDate: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(
        `/.netlify/functions/weight-entries?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weight entries')
      }

      return data.entries || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch weight entries'
      console.error('Fetch weight entries error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Add new weight entry
  async function addWeightEntry(weight: number, date?: string, notes?: string, updateProfile = false) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/weight-entries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          weight,
          date: date || getLocalDateString(),
          notes,
          updateProfile
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add weight entry')
      }

      // Refresh weight history
      await fetchWeightHistory()
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add weight entry'
      console.error('Add weight entry error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Remove weight entry
  async function removeWeightEntry(id: number) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/.netlify/functions/weight-entries?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove weight entry')
      }

      // Remove from local state
      weightEntries.value = weightEntries.value.filter(entry => entry.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove weight entry'
      console.error('Remove weight entry error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Get latest weight
  function getLatestWeight(): number | null {
    if (weightEntries.value.length === 0) return null
    return weightEntries.value[0].weight // Entries are ordered by date desc
  }

  // Get weight change over period
  function getWeightChange(days = 7): number | null {
    if (weightEntries.value.length < 2) return null

    const now = new Date()
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const pastDateStr = getLocalDateString(pastDate)

    const latestWeight = weightEntries.value[0]?.weight
    const pastWeight = weightEntries.value.find(
      entry => entry.date <= pastDateStr
    )?.weight

    if (!latestWeight || !pastWeight) return null

    return latestWeight - pastWeight
  }

  return {
    weightEntries,
    isLoading,
    error,
    fetchWeightHistory,
    fetchWeightByDateRange,
    addWeightEntry,
    removeWeightEntry,
    getLatestWeight,
    getWeightChange
  }
})
