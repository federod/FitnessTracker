<template>
  <div class="monthly-summary">
    <div class="header">
      <button @click="previousMonth" class="nav-btn">
        <span class="arrow">←</span>
      </button>
      <h2>{{ monthLabel }}</h2>
      <button @click="nextMonth" class="nav-btn" :disabled="isCurrentMonth">
        <span class="arrow">→</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading">
      <p>Loading monthly data...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="summary-content">
      <!-- Monthly Totals Card -->
      <div class="totals-card">
        <h3>Monthly Totals</h3>
        <div class="totals-grid">
          <div class="total-item">
            <span class="label">Calories</span>
            <span class="value">{{ monthlyData?.totalCalories?.toLocaleString() || 0 }}</span>
            <span class="avg">Avg: {{ dailyAverage('calories') }}/day</span>
          </div>
          <div class="total-item">
            <span class="label">Protein</span>
            <span class="value">{{ monthlyData?.totalProtein?.toFixed(0) || 0 }}g</span>
            <span class="avg">Avg: {{ dailyAverage('protein') }}g/day</span>
          </div>
          <div class="total-item">
            <span class="label">Carbs</span>
            <span class="value">{{ monthlyData?.totalCarbs?.toFixed(0) || 0 }}g</span>
            <span class="avg">Avg: {{ dailyAverage('carbs') }}g/day</span>
          </div>
          <div class="total-item">
            <span class="label">Fat</span>
            <span class="value">{{ monthlyData?.totalFat?.toFixed(0) || 0 }}g</span>
            <span class="avg">Avg: {{ dailyAverage('fat') }}g/day</span>
          </div>
          <div class="total-item">
            <span class="label">Exercise</span>
            <span class="value">{{ monthlyData?.totalExerciseMinutes || 0 }} min</span>
            <span class="avg">Avg: {{ dailyAverage('exercise') }} min/day</span>
          </div>
          <div class="total-item">
            <span class="label">Calories Burned</span>
            <span class="value">{{ monthlyData?.totalCaloriesBurned?.toLocaleString() || 0 }}</span>
            <span class="avg">Avg: {{ dailyAverage('burned') }}/day</span>
          </div>
        </div>
      </div>

      <!-- Weekly Breakdown -->
      <div class="weekly-breakdown">
        <h3>Weekly Breakdown</h3>
        <div class="weeks-grid">
          <div
            v-for="(week, index) in weeklyBreakdown"
            :key="index"
            class="week-card"
          >
            <div class="week-header">
              <h4>Week {{ index + 1 }}</h4>
              <span class="week-dates">{{ week.dateRange }}</span>
            </div>
            <div class="week-stats">
              <div class="stat-row">
                <span class="stat-label">Calories:</span>
                <span class="stat-value">{{ week.calories.toLocaleString() }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Protein:</span>
                <span class="stat-value">{{ week.protein.toFixed(0) }}g</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Exercise:</span>
                <span class="stat-value">{{ week.exerciseMinutes }} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weight Progress -->
      <div v-if="monthlyData?.weightData && monthlyData.weightData.length > 0" class="weight-card">
        <h3>Weight Progress</h3>
        <div class="weight-chart">
          <div
            v-for="entry in monthlyData.weightData"
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
            {{ weightChange > 0 ? '+' : '' }}{{ weightChange.toFixed(1) }} kg this month
          </span>
        </div>
      </div>

      <!-- Daily Stats Overview -->
      <div class="daily-overview">
        <h3>Daily Activity</h3>
        <div class="calendar-grid">
          <div
            v-for="day in monthlyData?.dailyData"
            :key="day.date"
            class="calendar-day"
            :class="{
              'has-data': day.calories > 0,
              'is-today': isToday(day.date)
            }"
            :title="getDayTooltip(day)"
          >
            <div class="day-number">{{ getDayNumber(day.date) }}</div>
            <div v-if="day.calories > 0" class="day-indicator">
              <span class="cal-badge">{{ Math.round(day.calories) }}</span>
            </div>
          </div>
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

interface MonthlyData {
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

interface WeekData {
  dateRange: string
  calories: number
  protein: number
  carbs: number
  fat: number
  exerciseMinutes: number
  caloriesBurned: number
}

const authStore = useAuthStore()
const isLoading = ref(false)
const error = ref<string | null>(null)
const monthlyData = ref<MonthlyData | null>(null)
const currentMonth = ref(new Date())

const monthLabel = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    currentMonth.value.getMonth() === now.getMonth() &&
    currentMonth.value.getFullYear() === now.getFullYear()
  )
})

const weightChange = computed(() => {
  if (!monthlyData.value?.weightData || monthlyData.value.weightData.length < 2) {
    return null
  }
  const sorted = [...monthlyData.value.weightData].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  return sorted[sorted.length - 1].weight - sorted[0].weight
})

const weeklyBreakdown = computed((): WeekData[] => {
  if (!monthlyData.value?.dailyData) return []

  const weeks: WeekData[] = []
  const dailyData = [...monthlyData.value.dailyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let currentWeek: DailyData[] = []
  let weekStartDate: Date | null = null

  dailyData.forEach((day, index) => {
    const dayDate = new Date(day.date)
    const dayOfWeek = dayDate.getDay()

    if (dayOfWeek === 0 || index === 0) {
      if (currentWeek.length > 0) {
        weeks.push(summarizeWeek(currentWeek, weekStartDate!))
      }
      currentWeek = [day]
      weekStartDate = dayDate
    } else {
      currentWeek.push(day)
    }

    if (index === dailyData.length - 1 && currentWeek.length > 0) {
      weeks.push(summarizeWeek(currentWeek, weekStartDate!))
    }
  })

  return weeks
})

function summarizeWeek(days: DailyData[], startDate: Date): WeekData {
  const endDate = new Date(days[days.length - 1].date)
  const dateRange = `${formatDate(startDate.toISOString())} - ${formatDate(endDate.toISOString())}`

  return {
    dateRange,
    calories: days.reduce((sum, d) => sum + d.calories, 0),
    protein: days.reduce((sum, d) => sum + d.protein, 0),
    carbs: days.reduce((sum, d) => sum + d.carbs, 0),
    fat: days.reduce((sum, d) => sum + d.fat, 0),
    exerciseMinutes: days.reduce((sum, d) => sum + d.exerciseMinutes, 0),
    caloriesBurned: days.reduce((sum, d) => sum + d.caloriesBurned, 0)
  }
}

function dailyAverage(type: string): string {
  if (!monthlyData.value?.dailyData) return '0'

  const daysWithData = monthlyData.value.dailyData.filter(d => d.calories > 0).length
  if (daysWithData === 0) return '0'

  let total = 0
  switch (type) {
    case 'calories':
      total = monthlyData.value.totalCalories
      break
    case 'protein':
      total = monthlyData.value.totalProtein
      break
    case 'carbs':
      total = monthlyData.value.totalCarbs
      break
    case 'fat':
      total = monthlyData.value.totalFat
      break
    case 'exercise':
      total = monthlyData.value.totalExerciseMinutes
      break
    case 'burned':
      total = monthlyData.value.totalCaloriesBurned
      break
  }

  return Math.round(total / daysWithData).toString()
}

function isToday(dateStr: string): boolean {
  const today = getLocalDateString()
  return dateStr === today
}

function getDayNumber(dateStr: string): number {
  return new Date(dateStr).getDate()
}

function getDayTooltip(day: DailyData): string {
  if (day.calories === 0) return 'No data'
  return `${day.calories} cal, ${day.protein.toFixed(0)}g protein, ${day.exerciseMinutes} min exercise`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

function previousMonth() {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() - 1)
  currentMonth.value = newMonth
}

function nextMonth() {
  if (!isCurrentMonth.value) {
    const newMonth = new Date(currentMonth.value)
    newMonth.setMonth(newMonth.getMonth() + 1)
    currentMonth.value = newMonth
  }
}

async function fetchMonthlyData() {
  isLoading.value = true
  error.value = null

  try {
    const firstDay = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
    const dateStr = getLocalDateString(firstDay)

    const response = await fetch(
      `/.netlify/functions/historical-data?type=month&date=${dateStr}`,
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
      throw new Error(data.error || 'Failed to fetch monthly data')
    }

    monthlyData.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch monthly data'
    console.error('Fetch monthly data error:', err)
  } finally {
    isLoading.value = false
  }
}

watch(currentMonth, () => {
  fetchMonthlyData()
})

onMounted(() => {
  fetchMonthlyData()
})
</script>

<style scoped>
.monthly-summary {
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

.totals-card, .weight-card, .daily-overview {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.totals-card h3, .weight-card h3, .weekly-breakdown h3, .daily-overview h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.totals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

.total-item .avg {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.weekly-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.weeks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.week-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  transition: transform 0.2s;
}

.week-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.week-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.week-header h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.week-dates {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.week-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--text-color);
}

.weight-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
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

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.calendar-day.has-data {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border-color: var(--primary-color);
}

.calendar-day.is-today {
  border: 2px solid var(--primary-color);
  font-weight: bold;
}

.calendar-day:hover {
  transform: scale(1.05);
}

.day-number {
  font-size: 0.875rem;
  font-weight: 600;
}

.day-indicator {
  margin-top: 0.25rem;
}

.cal-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .totals-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .weeks-grid {
    grid-template-columns: 1fr;
  }

  .calendar-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }

  .calendar-day {
    padding: 0.25rem;
  }

  .day-number {
    font-size: 0.75rem;
  }

  .header h2 {
    font-size: 1.25rem;
  }
}
</style>
