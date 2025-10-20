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
            <span class="value">{{ weeklyData?.totals?.calories?.toLocaleString() || 0 }}</span>
          </div>
          <div class="total-item">
            <span class="label">Protein</span>
            <span class="value">{{ weeklyData?.totals?.protein?.toFixed(1) || 0 }}g</span>
          </div>
          <div class="total-item">
            <span class="label">Carbs</span>
            <span class="value">{{ weeklyData?.totals?.carbs?.toFixed(1) || 0 }}g</span>
          </div>
          <div class="total-item">
            <span class="label">Fat</span>
            <span class="value">{{ weeklyData?.totals?.fat?.toFixed(1) || 0 }}g</span>
          </div>
          <div class="total-item">
            <span class="label">Exercise</span>
            <span class="value">{{ weeklyData?.totals?.exerciseMinutes || 0 }} min</span>
          </div>
          <div class="total-item">
            <span class="label">Burned</span>
            <span class="value">{{ weeklyData?.totals?.caloriesBurned || 0 }} cal</span>
          </div>
        </div>
      </div>

      <!-- Daily Breakdown -->
      <div class="daily-breakdown" v-if="weeklyData && weeklyData.dailyData">
        <h3>Daily Breakdown</h3>
        <div
          v-for="day in weeklyData.dailyData"
          :key="`${weeklyData.startDate}-${day.date}`"
          class="day-card"
          :class="{ 'is-today': isToday(day.date) }"
        >
          <div class="day-header">
            <div class="day-title">
              <h4>{{ formatDayLabel(day.date) }}</h4>
              <span class="date">{{ formatDate(day.date) }}</span>
            </div>
          </div>

          <div class="day-content">
            <div class="calories-section">
              <div class="calories-main">
                <span class="calories-label">Calories</span>
                <span class="calories-value">{{ day.calories.toLocaleString() }}</span>
              </div>
            </div>

            <div class="macros-section">
              <div class="macro-badge protein">
                <span class="macro-label">Protein</span>
                <span class="macro-value">{{ day.protein?.toFixed(0) }}g</span>
              </div>
              <div class="macro-badge carbs">
                <span class="macro-label">Carbs</span>
                <span class="macro-value">{{ day.carbs?.toFixed(0) }}g</span>
              </div>
              <div class="macro-badge fat">
                <span class="macro-label">Fat</span>
                <span class="macro-value">{{ day.fat?.toFixed(0) }}g</span>
              </div>
            </div>

            <div v-if="day.exerciseMinutes > 0" class="exercise-section">
              <span class="exercise-label">Exercise</span>
              <span class="exercise-value">{{ day.exerciseMinutes }} min</span>
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
import { getLocalDateString } from '@/utils/date'

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
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    exerciseMinutes: number
    caloriesBurned: number
  }
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
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  return dateStr === todayStr
}

function formatDayLabel(dateStr: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

function formatDate(dateStr: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
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
  weeklyData.value = null // Clear old data before fetching new data

  try {
    const startDate = getLocalDateString(currentWeekStart.value)

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
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  overflow: hidden;
  position: relative;
}

.day-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.day-card.is-today {
  border-color: var(--primary-color);
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15);
}

.day-card.is-today::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary-color);
}

.day-header {
  padding: 1.25rem 1.5rem 1rem;
  background: linear-gradient(135deg, var(--bg-color) 0%, var(--card-bg) 100%);
  border-bottom: 1px solid var(--border-color);
}

.day-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  letter-spacing: -0.01em;
}

.date {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-light);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.day-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Calories Section */
.calories-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.calories-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 122, 255, 0.04) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.1);
}

.calories-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calories-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.02em;
}

/* Macros Section */
.macros-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.macro-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 0.75rem;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.macro-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.macro-badge.protein {
  border-left: 3px solid #ef4444;
}

.macro-badge.carbs {
  border-left: 3px solid #3b82f6;
}

.macro-badge.fat {
  border-left: 3px solid #f59e0b;
}

.macro-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.macro-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-color);
}

.macro-badge.protein .macro-label {
  color: #ef4444;
}

.macro-badge.carbs .macro-label {
  color: #3b82f6;
}

.macro-badge.fat .macro-label {
  color: #f59e0b;
}

/* Exercise Section */
.exercise-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.exercise-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.exercise-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: #10b981;
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

  .header h2 {
    font-size: 1.25rem;
  }

  .day-header {
    padding: 1rem 1.25rem 0.875rem;
  }

  .day-content {
    padding: 1.25rem;
    gap: 1rem;
  }

  .calories-value {
    font-size: 1.5rem;
  }

  .macros-section {
    gap: 0.5rem;
  }

  .macro-badge {
    padding: 0.75rem 0.5rem;
  }

  .macro-label {
    font-size: 0.7rem;
  }

  .macro-value {
    font-size: 1rem;
  }

  .exercise-section {
    padding: 0.875rem 1rem;
  }

  .exercise-value {
    font-size: 1.25rem;
  }
}
</style>
