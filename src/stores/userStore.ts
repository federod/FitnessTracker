import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, DailyGoals } from '@/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile>({
    name: 'User',
    age: 30,
    gender: 'other',
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintain',
    targetWeight: 70
  })

  // Calculate BMR using Mifflin-St Jeor Equation
  const bmr = computed(() => {
    const { weight, height, age, gender } = profile.value
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  })

  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = computed(() => {
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9
    }
    return Math.round(bmr.value * activityMultipliers[profile.value.activityLevel])
  })

  // Calculate daily calorie goal based on weight goal
  const dailyGoals = computed<DailyGoals>(() => {
    let calorieGoal = tdee.value

    if (profile.value.goal === 'lose') {
      calorieGoal -= 500 // 500 calorie deficit for weight loss
    } else if (profile.value.goal === 'gain') {
      calorieGoal += 500 // 500 calorie surplus for weight gain
    }

    // Macros based on common recommendations (40% carbs, 30% protein, 30% fat)
    return {
      calories: calorieGoal,
      protein: Math.round((calorieGoal * 0.3) / 4), // 4 calories per gram
      carbs: Math.round((calorieGoal * 0.4) / 4),
      fat: Math.round((calorieGoal * 0.3) / 9) // 9 calories per gram
    }
  })

  function updateProfile(updates: Partial<UserProfile>) {
    profile.value = { ...profile.value, ...updates }
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    localStorage.setItem('userProfile', JSON.stringify(profile.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('userProfile')
    if (saved) {
      profile.value = JSON.parse(saved)
    }
  }

  return {
    profile,
    dailyGoals,
    bmr,
    tdee,
    updateProfile,
    loadFromLocalStorage
  }
})
