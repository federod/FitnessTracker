import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import type { FoodEntry, FoodItem, NutritionSummary } from '@/types'

export const useFoodStore = defineStore('food', () => {
  const foodEntries = ref<FoodEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Common foods for quick selection (kept in memory)
  const commonFoods = ref<FoodItem[]>([
    {
      id: '1',
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      servingSize: '100g'
    },
    {
      id: '2',
      name: 'Brown Rice',
      calories: 112,
      protein: 2.6,
      carbs: 24,
      fat: 0.9,
      servingSize: '100g'
    },
    {
      id: '3',
      name: 'Broccoli',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      servingSize: '100g'
    },
    {
      id: '4',
      name: 'Banana',
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      servingSize: '1 medium (118g)'
    },
    {
      id: '5',
      name: 'Egg',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      servingSize: '2 large'
    },
    {
      id: '6',
      name: 'Oatmeal',
      calories: 389,
      protein: 17,
      carbs: 66,
      fat: 7,
      servingSize: '100g'
    },
    {
      id: '7',
      name: 'Salmon',
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      servingSize: '100g'
    },
    {
      id: '8',
      name: 'Greek Yogurt',
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      servingSize: '100g'
    }
  ])

  const authStore = useAuthStore()

  // Get auth headers
  function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    }
  }

  // Fetch food entries for a specific date
  async function fetchEntriesByDate(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0]
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/.netlify/functions/food-entries?date=${targetDate}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch food entries')
      }

      foodEntries.value = data.entries || []
      return data.entries
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch food entries'
      console.error('Fetch food entries error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Fetch food entries for a date range (for weekly/monthly views)
  async function fetchEntriesByDateRange(startDate: string, endDate: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(
        `/.netlify/functions/food-entries?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch food entries')
      }

      return data.entries || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch food entries'
      console.error('Fetch food entries error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Get today's nutrition summary
  function getTodaysSummary(): NutritionSummary {
    const today = new Date().toISOString().split('T')[0]
    const todaysEntries = foodEntries.value.filter(entry => entry.date === today)

    return todaysEntries.reduce(
      (summary, entry) => {
        const multiplier = entry.servings
        return {
          calories: summary.calories + entry.foodItem.calories * multiplier,
          protein: summary.protein + entry.foodItem.protein * multiplier,
          carbs: summary.carbs + entry.foodItem.carbs * multiplier,
          fat: summary.fat + entry.foodItem.fat * multiplier
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  // Get entries by meal type
  function getEntriesByMealType(mealType: string, date?: string): FoodEntry[] {
    const targetDate = date || new Date().toISOString().split('T')[0]
    return foodEntries.value.filter(
      entry => entry.mealType === mealType && entry.date === targetDate
    )
  }

  // Add new food entry
  async function addFoodEntry(entry: {
    foodItem: FoodItem
    servings: number
    mealType: string
    date: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/food-entries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          foodItemId: entry.foodItem.id,
          servings: entry.servings,
          mealType: entry.mealType,
          date: entry.date,
          // If foodItem doesn't have a numeric ID, it's a custom food
          customFood: isNaN(parseInt(entry.foodItem.id)) ? {
            name: entry.foodItem.name,
            calories: entry.foodItem.calories,
            protein: entry.foodItem.protein,
            carbs: entry.foodItem.carbs,
            fat: entry.foodItem.fat,
            servingSize: entry.foodItem.servingSize,
          } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add food entry')
      }

      // Refresh entries for today
      await fetchEntriesByDate(entry.date)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add food entry'
      console.error('Add food entry error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Remove food entry
  async function removeFoodEntry(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/.netlify/functions/food-entries?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove food entry')
      }

      // Remove from local state
      foodEntries.value = foodEntries.value.filter(entry => entry.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove food entry'
      console.error('Remove food entry error:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Add custom food (kept for backward compatibility with common foods list)
  function addCustomFood(food: Omit<FoodItem, 'id'>) {
    const newFood: FoodItem = {
      ...food,
      id: `custom-${Date.now()}`
    }
    commonFoods.value.push(newFood)
    // Note: Custom foods will be saved to DB when added to a meal
  }

  // Legacy function - now just fetches from database
  async function loadFromLocalStorage() {
    await fetchEntriesByDate()
  }

  return {
    foodEntries,
    commonFoods,
    isLoading,
    error,
    getTodaysSummary,
    getEntriesByMealType,
    fetchEntriesByDate,
    fetchEntriesByDateRange,
    addFoodEntry,
    removeFoodEntry,
    addCustomFood,
    loadFromLocalStorage
  }
})
