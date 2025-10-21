export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: string
}

export interface FoodEntry {
  id: string
  foodItem: FoodItem
  servings: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date: string
  timestamp: Date
}

export interface Exercise {
  id: string
  name: string
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'knees-over-toes' | 'plyos'
  duration: number // in minutes
  caloriesBurned: number
  date: string
  timestamp: Date
  notes?: string
}

export interface UserProfile {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number // in cm
  weight: number // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
  goal: 'lose' | 'maintain' | 'gain'
  targetWeight?: number
  unitSystem?: 'metric' | 'imperial'
  useCustomMacros?: boolean
  customCalories?: number
  customProtein?: number
  customCarbs?: number
  customFat?: number
}

export interface DailyGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}
