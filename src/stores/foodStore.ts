import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FoodEntry, FoodItem, NutritionSummary } from '@/types'

export const useFoodStore = defineStore('food', () => {
  const foodEntries = ref<FoodEntry[]>([])
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

  function getEntriesByDate(date: string): FoodEntry[] {
    return foodEntries.value.filter(entry => entry.date === date)
  }

  function getEntriesByMealType(mealType: string, date?: string): FoodEntry[] {
    const targetDate = date || new Date().toISOString().split('T')[0]
    return foodEntries.value.filter(
      entry => entry.mealType === mealType && entry.date === targetDate
    )
  }

  function addFoodEntry(entry: Omit<FoodEntry, 'id' | 'timestamp'>) {
    const newEntry: FoodEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    foodEntries.value.push(newEntry)
    saveToLocalStorage()
  }

  function removeFoodEntry(id: string) {
    foodEntries.value = foodEntries.value.filter(entry => entry.id !== id)
    saveToLocalStorage()
  }

  function addCustomFood(food: Omit<FoodItem, 'id'>) {
    const newFood: FoodItem = {
      ...food,
      id: Date.now().toString()
    }
    commonFoods.value.push(newFood)
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    localStorage.setItem('foodEntries', JSON.stringify(foodEntries.value))
    localStorage.setItem('commonFoods', JSON.stringify(commonFoods.value))
  }

  function loadFromLocalStorage() {
    const savedEntries = localStorage.getItem('foodEntries')
    const savedFoods = localStorage.getItem('commonFoods')

    if (savedEntries) {
      foodEntries.value = JSON.parse(savedEntries)
    }
    if (savedFoods) {
      commonFoods.value = JSON.parse(savedFoods)
    }
  }

  return {
    foodEntries,
    commonFoods,
    getTodaysSummary,
    getEntriesByDate,
    getEntriesByMealType,
    addFoodEntry,
    removeFoodEntry,
    addCustomFood,
    loadFromLocalStorage
  }
})
