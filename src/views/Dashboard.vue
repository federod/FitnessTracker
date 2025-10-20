<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useFoodStore } from '@/stores/foodStore'
import { useUserStore } from '@/stores/userStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import NutritionProgress from '@/components/NutritionProgress.vue'
import DateNavigator from '@/components/DateNavigator.vue'
import { getLocalDateString } from '@/utils/date'

const foodStore = useFoodStore()
const userStore = useUserStore()
const exerciseStore = useExerciseStore()

const selectedDate = ref(getLocalDateString())

onMounted(() => {
  userStore.fetchProfile()
  loadDataForDate(selectedDate.value)
})

watch(selectedDate, (newDate) => {
  loadDataForDate(newDate)
})

async function loadDataForDate(date: string) {
  await foodStore.fetchEntriesByDate(date)
  await exerciseStore.fetchExercisesByDate(date)
}

const todaysSummary = computed(() => {
  const entries = foodStore.foodEntries.filter(entry => entry.date === selectedDate.value)
  return entries.reduce(
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
})

const dailyGoals = computed(() => userStore.dailyGoals)

const caloriesBurned = computed(() => {
  const exercises = exerciseStore.exercises.filter(ex => ex.date === selectedDate.value)
  return exercises.reduce((total, exercise) => total + exercise.caloriesBurned, 0)
})

const exerciseCount = computed(() => {
  return exerciseStore.exercises.filter(ex => ex.date === selectedDate.value).length
})

const netCalories = computed(() => todaysSummary.value.calories - caloriesBurned.value)

const dateLabel = computed(() => {
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="dashboard">
        <header class="dashboard-header">
          <h2>Dashboard</h2>
          <p class="date">{{ dateLabel }}</p>
        </header>

        <DateNavigator v-model="selectedDate" />

        <div class="dashboard-grid">
          <div class="card calories-card animate-in">
            <div class="card-header">
              <h3>Today's Nutrition</h3>
              <span class="card-icon">🥗</span>
            </div>
            <NutritionProgress :current="todaysSummary" :goals="dailyGoals" />
          </div>

          <div class="card exercise-card animate-in" style="animation-delay: 0.1s">
            <div class="card-header">
              <h3>Exercise</h3>
              <span class="card-icon">💪</span>
            </div>
            <div class="exercise-summary">
              <div class="stat">
                <div class="stat-value">{{ caloriesBurned }}</div>
                <div class="stat-label">Calories Burned</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ exerciseCount }}</div>
                <div class="stat-label">Workouts</div>
              </div>
            </div>
          </div>

          <div class="card net-card animate-in" style="animation-delay: 0.2s">
            <div class="card-header">
              <h3>Net Calories</h3>
              <span class="card-icon">⚖️</span>
            </div>
            <div class="net-summary">
              <div class="net-calculation">
                <div class="calc-item">
                  <span class="calc-label">Food</span>
                  <span class="calc-value">{{ Math.round(todaysSummary.calories) }}</span>
                </div>
                <div class="calc-operator">-</div>
                <div class="calc-item">
                  <span class="calc-label">Exercise</span>
                  <span class="calc-value">{{ caloriesBurned }}</span>
                </div>
                <div class="calc-operator">=</div>
                <div class="calc-item result">
                  <span class="calc-label">Net</span>
                  <span class="calc-value">{{ Math.round(netCalories) }}</span>
                </div>
              </div>
              <div class="goal-comparison">
                Goal: {{ dailyGoals.calories }} calories
              </div>
            </div>
          </div>

          <div class="card quick-actions animate-in" style="animation-delay: 0.3s">
            <div class="card-header">
              <h3>Quick Actions</h3>
              <span class="card-icon">⚡</span>
            </div>
            <div class="actions-grid">
              <RouterLink to="/food-log" class="action-button">
                <div class="action-content">
                  <span class="action-icon">🍽️</span>
                  <div class="action-info">
                    <span class="action-title">Log Food</span>
                    <span class="action-subtitle">Track your meals</span>
                  </div>
                </div>
                <span class="action-arrow">›</span>
              </RouterLink>
              <RouterLink to="/exercise" class="action-button">
                <div class="action-content">
                  <span class="action-icon">🏃</span>
                  <div class="action-info">
                    <span class="action-title">Log Exercise</span>
                    <span class="action-subtitle">Record your workouts</span>
                  </div>
                </div>
                <span class="action-arrow">›</span>
              </RouterLink>
              <RouterLink to="/profile" class="action-button">
                <div class="action-content">
                  <span class="action-icon">👤</span>
                  <div class="action-info">
                    <span class="action-title">Update Profile</span>
                    <span class="action-subtitle">Manage your goals</span>
                  </div>
                </div>
                <span class="action-arrow">›</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
}

.dashboard {
  padding: 1.5rem 0;
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.dashboard-header h2 {
  margin-bottom: 0.5rem;
}

.date {
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.calories-card {
  grid-column: span 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.card-icon {
  font-size: 1.75rem;
}

.exercise-summary {
  display: flex;
  gap: 2rem;
  justify-content: space-around;
  margin-top: 1rem;
}

.stat {
  text-align: center;
  flex: 1;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--ios-blue);
  letter-spacing: -1px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.net-summary {
  margin-top: 1rem;
}

.net-calculation {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: var(--radius-md);
}

.calc-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.calc-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calc-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.calc-item.result .calc-value {
  color: var(--ios-blue);
  font-size: 2rem;
  letter-spacing: -1px;
}

.calc-operator {
  font-size: 1.5rem;
  color: var(--text-light);
  font-weight: 300;
}

.goal-comparison {
  text-align: center;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 500;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--fill-tertiary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  min-height: 70px;
  border: 0.5px solid var(--separator);
}

.action-button:active {
  opacity: 0.5;
  transform: scale(0.98);
  background: var(--fill-secondary);
}

.action-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fill-secondary);
  border-radius: 10px;
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-align: left;
}

.action-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.4px;
}

.action-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-tertiary);
  letter-spacing: -0.2px;
}

.action-arrow {
  font-size: 24px;
  color: var(--text-tertiary);
  font-weight: 300;
}

.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem 0;
  }

  .calories-card {
    grid-column: span 1;
  }

  .dashboard-grid {
    gap: 0.75rem;
  }

  .exercise-summary {
    flex-direction: column;
    gap: 0.75rem;
  }

  .net-calculation {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .calc-operator {
    transform: rotate(90deg);
  }

  .stat-value {
    font-size: 2rem;
  }

  .calc-item.result .calc-value {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .action-button {
    padding: 0.875rem 1rem;
    min-height: 64px;
  }

  .action-icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
  }

  .action-title {
    font-size: 16px;
  }

  .action-subtitle {
    font-size: 12px;
  }
}
</style>
