import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, DailyGoals } from '@/types'
import { useAuthStore } from './authStore'

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Calculate BMR using Mifflin-St Jeor Equation
  const bmr = computed(() => {
    if (!profile.value) return 0
    const { weight, height, age, gender } = profile.value
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  })

  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = computed(() => {
    if (!profile.value) return 0
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
    if (!profile.value) {
      return {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 67
      }
    }

    // Use custom macros if set
    if (profile.value.useCustomMacros && profile.value.customCalories) {
      return {
        calories: profile.value.customCalories,
        protein: profile.value.customProtein || 0,
        carbs: profile.value.customCarbs || 0,
        fat: profile.value.customFat || 0
      }
    }

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

  async function fetchProfile() {
    if (!authStore.token) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/profile-get', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }

      profile.value = data.profile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch profile'
      console.error('Fetch profile error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!authStore.token) return

    isLoading.value = true
    error.value = null

    const profileData = profile.value ? { ...profile.value, ...updates } : updates

    try {
      const response = await fetch('/.netlify/functions/profile-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      profile.value = data.profile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile'
      console.error('Update profile error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    profile,
    dailyGoals,
    bmr,
    tdee,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  }
})
