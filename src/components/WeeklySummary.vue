<template>
  <div class="weekly-summary">
    <div class="header">
      <button @click="previousWeek" class="nav-btn">
        <span class="arrow">←</span>
      </button>
      <h2>{{ weekLabel }}</h2>
      <button @click="nextWeek" class="nav-btn" :disabled="isCurrentWeek">
        <span class="arrow">→</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading">
      <p>Loading weekly data...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="summary-content">
      <!-- Weekly Totals Card -->
      <div class="totals-card">
        <h3>Weekly Totals</h3>
        <div class="totals-grid">
          <div class="total-item">
            <span class="label">Calories</span>
            <span class="value">{{ weeklyData?.totalCalories?.toLocaleString() || 0 }}</span>
          </div>
          <div class="total-item">
            <span class="label">Protein</span>
            <span class="value">{{ weeklyData?.totalProtein?.toFixed(1) || 0 }}g</span>
          </div>
          <div class="total-item">
            <span class="label">Carbs</span>
            <span class="value">{{ weeklyData?.totalCarbs?.toFixed(1) || 0 }}g</span>
          </div>
          <div class="total-item">
            <span class="label">Fat</span>
            <span class="value">{{ weeklyData?.totalFat?.toFixed(1) || 0 }}g</span>
          </div>
          <div class="total-item">
            <span class="label">Exercise</span>
            <span class="value">{{ weeklyData?.totalExerciseMinutes || 0 }} min</span>
          </div>
          <div class="total-item">
            <span class="label">Burned</span>
            <span class="value">{{ weeklyData?.totalCaloriesBurned || 0 }} cal</span>
          </div>
        </div>
      </div>

      <!-- Daily Breakdown -->
      <div class="daily-breakdown">
        <h3>Daily Breakdown</h3>
        <div
          v-for="day in weeklyData?.dailyData"
          :key="day.date"
          class="day-card"
          :class="{ 'is-today': isToday(day.date) }"
        >
          <div class="day-header">
            <h4>{{ formatDayLabel(day.date) }}</h4>
            <span class="date">{{ formatDate(day.date) }}</span>
          </div>
          <div class="day-stats">
            <div class="stat">
              <span class="stat-label">Calories</span>
              <span class="stat-value">{{ day.calories }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">P: {{ day.protein?.toFixed(0) }}g</span>
              <span class="stat-label">C: {{ day.carbs?.toFixed(0) }}g</span>
              <span class="stat-label">F: {{ day.fat?.toFixed(0) }}g</span>
            </div>
            <div class="stat" v-if="day.exerciseMinutes > 0">
              <span class="stat-label">Exercise</span>
              <span class="stat-value">{{ day.exerciseMinutes }} min</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Weight Progress -->
      <div v-if="weeklyData?.weightData && weeklyData.weightData.length > 0" class="weight-card">
        <h3>Weight Progress</h3>
        <div class="weight-entries">
          <div
            v-for="entry in weeklyData.weightData"
            :key="entry.date"
            class="weight-entry"
          >
            <span class="weight-date">{{ formatDate(entry.date) }}</span>
            <span class="weight-value">{{ entry.weight }} kg</span>
            <span v-if="entry.notes" class="weight-notes">{{ entry.notes }}</span>
          </div>
        </div>
        <div v-if="weightChange !== null" class="weight-change">
          <span :class="weightChange < 0 ? 'loss' : 'gain'">
            {{ weightChange > 0 ? '+' : '' }}{{ weightChange.toFixed(1) }} kg this week
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

interface DailyData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  exerciseMinutes: number
  caloriesBurned: number
}

interface WeightData {
  date: string
  weight: number
  notes?: string
}

interface WeeklyData {
  startDate: string
  endDate: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalExerciseMinutes: number
  totalCaloriesBurned: number
  dailyData: DailyData[]
  weightData: WeightData[]
}

const authStore = useAuthStore()
const isLoading = ref(false)
const error = ref<string | null>(null)
const weeklyData = ref<WeeklyData | null>(null)
const currentWeekStart = ref(getStartOfWeek(new Date()))

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

function getEndOfWeek(startDate: Date): Date {
  const end = new Date(startDate)
  end.setDate(end.getDate() + 6)
  return end
}

const weekLabel = computed(() => {
  const start = currentWeekStart.value
  const end = getEndOfWeek(start)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
})

const isCurrentWeek = computed(() => {
  const now = getStartOfWeek(new Date())
  return currentWeekStart.value.toDateString() === now.toDateString()
})

const weightChange = computed(() => {
  if (!weeklyData.value?.weightData || weeklyData.value.weightData.length < 2) {
    return null
  }
  const sorted = [...weeklyData.value.weightData].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  return sorted[sorted.length - 1].weight - sorted[0].weight
})

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

function previousWeek() {
  const newStart = new Date(currentWeekStart.value)
  newStart.setDate(newStart.getDate() - 7)
  currentWeekStart.value = newStart
}

function nextWeek() {
  if (!isCurrentWeek.value) {
    const newStart = new Date(currentWeekStart.value)
    newStart.setDate(newStart.getDate() + 7)
    currentWeekStart.value = newStart
  }
}

async function fetchWeeklyData() {
  isLoading.value = true
  error.value = null

  try {
    const startDate = currentWeekStart.value.toISOString().split('T')[0]

    const response = await fetch(
      `/.netlify/functions/historical-data?type=week&date=${startDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch weekly data')
    }

    weeklyData.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch weekly data'
    console.error('Fetch weekly data error:', err)
  } finally {
    isLoading.value = false
  }
}

watch(currentWeekStart, () => {
  fetchWeeklyData()
})

onMounted(() => {
  fetchWeeklyData()
})
</script>

<style scoped>
.weekly-summary {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  text-align: center;
}

.nav-btn {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow {
  font-size: 1.25rem;
  font-weight: bold;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: var(--error-color);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.totals-card, .weight-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.totals-card h3, .weight-card h3, .daily-breakdown h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.totals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.total-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-color);
  border-radius: 8px;
}

.total-item .label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.total-item .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.daily-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.day-card:hover {
  transform: translateY(-2px);
}

.day-card.is-today {
  border: 2px solid var(--primary-color);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.day-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.day-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.weight-entries {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.weight-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-color);
  border-radius: 8px;
}

.weight-date {
  font-weight: 600;
  min-width: 80px;
}

.weight-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
  min-width: 80px;
}

.weight-notes {
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex: 1;
}

.weight-change {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-color);
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.weight-change .loss {
  color: #10b981;
}

.weight-change .gain {
  color: #f59e0b;
}

@media (max-width: 768px) {
  .totals-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .day-stats {
    grid-template-columns: 1fr;
  }

  .header h2 {
    font-size: 1.25rem;
  }
}
</style>
