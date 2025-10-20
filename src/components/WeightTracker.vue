<template>
  <div class="weight-tracker">
    <div class="tracker-header">
      <h2>Weight Tracker</h2>
      <button @click="showAddModal = true" class="add-btn">
        + Add Weight
      </button>
    </div>

    <!-- Current Weight Card -->
    <div v-if="latestWeight" class="current-weight-card">
      <div class="weight-display">
        <span class="label">Current Weight</span>
        <span class="weight">{{ latestWeight.weight }} kg</span>
        <span class="date">As of {{ formatDate(latestWeight.date) }}</span>
      </div>
      <div v-if="weightChange7Days !== null" class="weight-change">
        <span class="change-label">7-day change:</span>
        <span :class="['change-value', weightChange7Days < 0 ? 'loss' : 'gain']">
          {{ weightChange7Days > 0 ? '+' : '' }}{{ weightChange7Days.toFixed(1) }} kg
        </span>
      </div>
    </div>

    <!-- Add Weight Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Add Weight Entry</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleAddWeight" class="weight-form">
          <div class="form-group">
            <label for="weight">Weight (kg)</label>
            <input
              id="weight"
              v-model.number="newWeight.weight"
              type="number"
              step="0.1"
              min="20"
              max="500"
              required
              placeholder="Enter weight in kg"
            />
          </div>

          <div class="form-group">
            <label for="date">Date</label>
            <input
              id="date"
              v-model="newWeight.date"
              type="date"
              :max="today"
              required
            />
          </div>

          <div class="form-group">
            <label for="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              v-model="newWeight.notes"
              placeholder="Add any notes about this measurement..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group checkbox">
            <label>
              <input
                v-model="newWeight.updateProfile"
                type="checkbox"
              />
              <span>Update my profile with this weight</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Adding...' : 'Add Entry' }}
            </button>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </div>
    </div>

    <!-- Weight History List -->
    <div class="weight-history">
      <h3>Weight History</h3>

      <div v-if="isLoading && weightEntries.length === 0" class="loading">
        <p>Loading weight history...</p>
      </div>

      <div v-else-if="weightEntries.length === 0" class="no-data">
        <p>No weight entries yet. Add your first measurement above!</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="entry in weightEntries"
          :key="entry.id"
          class="history-item"
        >
          <div class="item-main">
            <div class="item-date">
              <span class="day">{{ formatDayLabel(entry.date) }}</span>
              <span class="date-text">{{ formatDate(entry.date) }}</span>
            </div>
            <div class="item-weight">
              <span class="weight-value">{{ entry.weight }} kg</span>
              <span v-if="entry.notes" class="weight-notes">{{ entry.notes }}</span>
            </div>
          </div>
          <button
            @click="handleDelete(entry.id)"
            class="delete-btn"
            title="Delete entry"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Simple Weight Chart -->
    <div v-if="weightEntries.length > 1" class="weight-chart">
      <h3>Weight Trend</h3>
      <div class="chart-container">
        <svg viewBox="0 0 400 200" class="chart-svg">
          <!-- Grid lines -->
          <line
            v-for="i in 5"
            :key="`grid-${i}`"
            :x1="0"
            :y1="i * 40"
            :x2="400"
            :y2="i * 40"
            stroke="#e5e7eb"
            stroke-width="1"
          />

          <!-- Weight line -->
          <polyline
            :points="chartPoints"
            fill="none"
            stroke="var(--primary-color)"
            stroke-width="3"
          />

          <!-- Data points -->
          <circle
            v-for="(point, index) in chartData"
            :key="`point-${index}`"
            :cx="point.x"
            :cy="point.y"
            r="5"
            fill="var(--primary-color)"
          >
            <title>{{ point.date }}: {{ point.weight }} kg</title>
          </circle>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWeightStore } from '@/stores/weightStore'

const weightStore = useWeightStore()

const showAddModal = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const today = new Date().toISOString().split('T')[0]

const newWeight = ref({
  weight: 0,
  date: today,
  notes: '',
  updateProfile: false
})

const weightEntries = computed(() => weightStore.weightEntries)
const latestWeight = computed(() => weightEntries.value[0] || null)
const weightChange7Days = computed(() => weightStore.getWeightChange(7))

const chartData = computed(() => {
  if (weightEntries.value.length < 2) return []

  const entries = [...weightEntries.value]
    .reverse()
    .slice(-10) // Last 10 entries for the chart

  const weights = entries.map(e => e.weight)
  const minWeight = Math.min(...weights) - 1
  const maxWeight = Math.max(...weights) + 1
  const weightRange = maxWeight - minWeight

  return entries.map((entry, index) => {
    const x = (index / (entries.length - 1)) * 380 + 10
    const y = 190 - ((entry.weight - minWeight) / weightRange) * 180
    return {
      x,
      y,
      weight: entry.weight,
      date: entry.date
    }
  })
})

const chartPoints = computed(() => {
  return chartData.value.map(p => `${p.x},${p.y}`).join(' ')
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateOnly = date.toISOString().split('T')[0]
  const todayOnly = today.toISOString().split('T')[0]
  const yesterdayOnly = yesterday.toISOString().split('T')[0]

  if (dateOnly === todayOnly) return 'Today'
  if (dateOnly === yesterdayOnly) return 'Yesterday'

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

function closeModal() {
  showAddModal.value = false
  newWeight.value = {
    weight: 0,
    date: today,
    notes: '',
    updateProfile: false
  }
  error.value = null
}

async function handleAddWeight() {
  if (newWeight.value.weight <= 0) {
    error.value = 'Please enter a valid weight'
    return
  }

  isLoading.value = true
  error.value = null

  const result = await weightStore.addWeightEntry(
    newWeight.value.weight,
    newWeight.value.date,
    newWeight.value.notes || undefined,
    newWeight.value.updateProfile
  )

  isLoading.value = false

  if (result.success) {
    closeModal()
  } else {
    error.value = result.error || 'Failed to add weight entry'
  }
}

async function handleDelete(id: number) {
  if (!confirm('Are you sure you want to delete this weight entry?')) {
    return
  }

  const result = await weightStore.removeWeightEntry(id)

  if (!result.success) {
    alert(result.error || 'Failed to delete weight entry')
  }
}

onMounted(() => {
  weightStore.fetchWeightHistory()
})
</script>

<style scoped>
.weight-tracker {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tracker-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.add-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.current-weight-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.weight-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.weight-display .label {
  font-size: 0.875rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.weight-display .weight {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
}

.weight-display .date {
  font-size: 0.875rem;
  opacity: 0.8;
}

.weight-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.change-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.change-value {
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
}

.change-value.loss {
  background: rgba(16, 185, 129, 0.2);
}

.change-value.gain {
  background: rgba(245, 158, 11, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-secondary);
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--border-color);
}

.weight-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.form-group input[type="number"],
.form-group input[type="date"],
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  text-transform: none;
  font-weight: normal;
  color: var(--text-color);
}

.form-group.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: var(--border-color);
  color: var(--text-color);
}

.cancel-btn:hover {
  background: var(--text-secondary);
  color: white;
}

.submit-btn {
  background: var(--primary-color);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background: #fee;
  color: #c00;
  border-radius: 8px;
  text-align: center;
  font-size: 0.875rem;
}

/* Weight History */
.weight-history {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weight-history h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.loading,
.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.history-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-main {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex: 1;
}

.item-date {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 100px;
}

.item-date .day {
  font-weight: 600;
  font-size: 0.875rem;
}

.item-date .date-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.item-weight {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.weight-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.weight-notes {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1);
}

/* Weight Chart */
.weight-chart {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weight-chart h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 200px;
}

.chart-svg {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .item-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .weight-display .weight {
    font-size: 2.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .tracker-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
  }
}
</style>
