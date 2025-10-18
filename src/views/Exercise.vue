<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useExerciseStore } from '@/stores/exerciseStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import type { Exercise } from '@/types'

const exerciseStore = useExerciseStore()

const showAddModal = ref(false)
const savedRuns = ref<any[]>([])
const exerciseForm = ref({
  name: '',
  type: 'cardio' as Exercise['type'],
  duration: 30,
  caloriesBurned: 0,
  notes: '',
  instructions: ''
})

const selectedMuscle = ref('')
const selectedDifficulty = ref('')
const apiExercises = ref<any[]>([])
const isSearching = ref(false)
const searchError = ref('')

const commonExercises = [
  { name: 'Running', type: 'cardio', caloriesPerMin: 10 },
  { name: 'Walking', type: 'cardio', caloriesPerMin: 4 },
  { name: 'Cycling', type: 'cardio', caloriesPerMin: 8 },
  { name: 'Swimming', type: 'cardio', caloriesPerMin: 9 },
  { name: 'Weight Training', type: 'strength', caloriesPerMin: 6 },
  { name: 'Yoga', type: 'flexibility', caloriesPerMin: 3 },
  { name: 'HIIT', type: 'cardio', caloriesPerMin: 12 },
  { name: 'Basketball', type: 'sports', caloriesPerMin: 8 }
]

onMounted(() => {
  exerciseStore.loadFromLocalStorage()
  loadSavedRuns()
  // Don't load exercises on mount - only when user selects filters
})

function loadSavedRuns() {
  const runs = JSON.parse(localStorage.getItem('runs') || '[]')
  savedRuns.value = runs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function deleteRun(runId: string) {
  if (confirm('Are you sure you want to delete this run?')) {
    const runs = JSON.parse(localStorage.getItem('runs') || '[]')
    const filtered = runs.filter((r: any) => r.id !== runId)
    localStorage.setItem('runs', JSON.stringify(filtered))
    loadSavedRuns()
  }
}

function formatRunDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const runDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (runDate.getTime() === today.getTime()) {
    return 'Today'
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (runDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Watch for search changes
watch([selectedMuscle, selectedDifficulty], () => {
  searchExercises()
})

async function searchExercises() {
  // Only search if at least one filter is selected
  if (!selectedMuscle.value && !selectedDifficulty.value) {
    apiExercises.value = []
    searchError.value = ''
    return
  }

  isSearching.value = true
  searchError.value = ''

  try {
    const params = new URLSearchParams()
    if (selectedMuscle.value) params.append('muscle', selectedMuscle.value)
    if (selectedDifficulty.value) params.append('difficulty', selectedDifficulty.value)

    const response = await fetch(`/.netlify/functions/exercise-search?${params.toString()}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Search failed')
    }

    apiExercises.value = data.exercises.slice(0, 10) // Limit to 10 results
  } catch (error) {
    console.error('Exercise search error:', error)
    searchError.value = error instanceof Error ? error.message : 'Search failed'
    apiExercises.value = []
  } finally {
    isSearching.value = false
  }
}

const todaysExercises = computed(() => exerciseStore.getTodaysExercises())
const totalCaloriesBurned = computed(() => exerciseStore.getTodaysCaloriesBurned())
const totalDuration = computed(() =>
  todaysExercises.value.reduce((total, ex) => total + ex.duration, 0)
)

function selectExercise(exercise: typeof commonExercises[0]) {
  exerciseForm.value.name = exercise.name
  exerciseForm.value.type = exercise.type as Exercise['type']
  updateCalories()
}

function selectApiExercise(exercise: any) {
  exerciseForm.value.name = exercise.name
  exerciseForm.value.type = exercise.type as Exercise['type']
  exerciseForm.value.instructions = exercise.instructions || ''
  // Estimate calories based on type
  const caloriesPerMin = exercise.type === 'cardio' ? 10 : exercise.type === 'strength' ? 6 : 5
  exerciseForm.value.caloriesBurned = Math.round(caloriesPerMin * exerciseForm.value.duration)
}

function updateCalories() {
  const exercise = commonExercises.find(ex => ex.name === exerciseForm.value.name)
  if (exercise) {
    exerciseForm.value.caloriesBurned = Math.round(exercise.caloriesPerMin * exerciseForm.value.duration)
  }
}

function addExercise() {
  const today = new Date().toISOString().split('T')[0]
  exerciseStore.addExercise({
    name: exerciseForm.value.name,
    type: exerciseForm.value.type,
    duration: exerciseForm.value.duration,
    caloriesBurned: exerciseForm.value.caloriesBurned,
    date: today,
    notes: exerciseForm.value.notes
  })

  closeModal()
}

function closeModal() {
  showAddModal.value = false
  exerciseForm.value = {
    name: '',
    type: 'cardio',
    duration: 30,
    caloriesBurned: 0,
    notes: '',
    instructions: ''
  }
  selectedMuscle.value = ''
  selectedDifficulty.value = ''
  searchError.value = ''
}

function removeExercise(id: string) {
  if (confirm('Are you sure you want to remove this exercise?')) {
    exerciseStore.removeExercise(id)
  }
}

function getExerciseIcon(type: Exercise['type']) {
  const icons = {
    cardio: '🏃',
    strength: '💪',
    flexibility: '🧘',
    sports: '⚽'
  }
  return icons[type]
}
</script>

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="exercise-page">
        <header class="page-header">
          <h2>Exercise Log</h2>
          <button @click="showAddModal = true">+ Add Exercise</button>
        </header>

        <div class="stats-grid">
          <div class="card stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">{{ totalCaloriesBurned }}</div>
            <div class="stat-label">Calories Burned</div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ totalDuration }}</div>
            <div class="stat-label">Minutes Active</div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon">💪</div>
            <div class="stat-value">{{ todaysExercises.length }}</div>
            <div class="stat-label">Workouts</div>
          </div>
        </div>

        <div class="card exercises-list">
          <h3>Today's Exercises</h3>
          <div v-if="todaysExercises.length === 0" class="empty-state">
            No exercises logged yet. Start by adding your first workout!
          </div>
          <div v-else class="exercise-entries">
            <div v-for="exercise in todaysExercises" :key="exercise.id" class="exercise-entry">
              <div class="exercise-icon">{{ getExerciseIcon(exercise.type) }}</div>
              <div class="exercise-info">
                <div class="exercise-name">{{ exercise.name }}</div>
                <div class="exercise-details">
                  {{ exercise.duration }} min • {{ exercise.type }}
                  <span v-if="exercise.notes"> • {{ exercise.notes }}</span>
                </div>
              </div>
              <div class="exercise-calories">
                {{ exercise.caloriesBurned }} cal
              </div>
              <button @click="removeExercise(exercise.id)" class="delete-btn">×</button>
            </div>
          </div>
        </div>

        <!-- Saved Runs Section -->
        <div v-if="savedRuns.length > 0" class="card saved-runs">
          <h3>Running History</h3>
          <div class="run-entries">
            <div v-for="run in savedRuns" :key="run.id" class="run-entry">
              <div class="run-icon">🏃</div>
              <div class="run-info">
                <div class="run-title">Running</div>
                <div class="run-details">
                  {{ formatRunDate(run.date) }} • {{ (run.distance / 1000).toFixed(2) }} km • {{ run.pace }} min/km
                </div>
              </div>
              <div class="run-stats">
                <div class="run-calories">{{ run.calories }} cal</div>
                <div class="run-duration">{{ Math.floor(run.duration / 60) }} min</div>
              </div>
              <button @click="deleteRun(run.id)" class="delete-btn">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <BottomNav />

    <!-- Add Exercise Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Exercise</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="api-search">
            <h4>Search Exercises:</h4>
            <div class="search-filters">
              <div class="filter-group">
                <label>Muscle Group:</label>
                <select v-model="selectedMuscle">
                  <option value="">All Muscles</option>
                  <option value="abdominals">Abdominals</option>
                  <option value="biceps">Biceps</option>
                  <option value="calves">Calves</option>
                  <option value="chest">Chest</option>
                  <option value="forearms">Forearms</option>
                  <option value="glutes">Glutes</option>
                  <option value="hamstrings">Hamstrings</option>
                  <option value="lats">Lats</option>
                  <option value="lower_back">Lower Back</option>
                  <option value="middle_back">Middle Back</option>
                  <option value="quadriceps">Quadriceps</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="triceps">Triceps</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Difficulty:</label>
                <select v-model="selectedDifficulty">
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div v-if="isSearching" class="search-loading">
              Searching exercises...
            </div>

            <div v-if="searchError" class="search-error">
              Exercise search temporarily unavailable. Please use the Quick Select options below.
            </div>

            <div v-if="apiExercises.length > 0 && !isSearching" class="api-results">
              <div
                v-for="exercise in apiExercises"
                :key="exercise.name"
                @click="selectApiExercise(exercise)"
                class="api-exercise-item"
                :class="{ selected: exerciseForm.name === exercise.name }"
              >
                <div class="api-exercise-name">{{ exercise.name }}</div>
                <div class="api-exercise-meta">
                  {{ exercise.type }} • {{ exercise.difficulty }}
                  <span v-if="exercise.muscle"> • {{ exercise.muscle }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="quick-select">
            <h4>Quick Select:</h4>
            <div class="exercise-buttons">
              <button
                v-for="exercise in commonExercises"
                :key="exercise.name"
                @click="selectExercise(exercise)"
                class="exercise-quick-btn"
                :class="{ selected: exerciseForm.name === exercise.name }"
              >
                {{ exercise.name }}
              </button>
            </div>
          </div>

          <form @submit.prevent="addExercise" class="exercise-form">
            <div class="form-group">
              <label>Exercise Name:</label>
              <input v-model="exerciseForm.name" type="text" required />
            </div>

            <div class="form-group">
              <label>Type:</label>
              <select v-model="exerciseForm.type" required>
                <option value="cardio">Cardio</option>
                <option value="strength">Strength</option>
                <option value="flexibility">Flexibility</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div class="form-group">
              <label>Duration (minutes):</label>
              <input
                v-model.number="exerciseForm.duration"
                type="number"
                min="1"
                required
                @input="updateCalories"
              />
            </div>

            <div class="form-group">
              <label>Calories Burned:</label>
              <input
                v-model.number="exerciseForm.caloriesBurned"
                type="number"
                min="0"
                required
              />
            </div>

            <div class="form-group">
              <label>Notes (optional):</label>
              <textarea v-model="exerciseForm.notes" rows="3"></textarea>
            </div>

            <div v-if="exerciseForm.instructions" class="form-group">
              <label>Instructions:</label>
              <div class="instructions-display">{{ exerciseForm.instructions }}</div>
            </div>

            <button type="submit">Add Exercise</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
}

.exercise-page {
  padding: 1.5rem 0;
}

@media (max-width: 768px) {
  .exercise-page {
    padding: 1rem 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  padding: 2rem 1rem;
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.exercises-list h3,
.saved-runs h3 {
  margin-bottom: 1.5rem;
}

.saved-runs {
  margin-top: 1.5rem;
}

.run-entries {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.run-entry {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: 8px;
  gap: 1rem;
}

.run-icon {
  font-size: 2rem;
}

.run-info {
  flex: 1;
}

.run-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.run-details {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.run-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.run-calories {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.run-duration {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-style: italic;
}

.exercise-entries {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exercise-entry {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: 8px;
  gap: 1rem;
}

.exercise-icon {
  font-size: 2rem;
}

.exercise-info {
  flex: 1;
}

.exercise-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.exercise-details {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.exercise-calories {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.delete-btn {
  background: var(--ios-red);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  min-height: 32px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all var(--transition-fast);
}

.delete-btn:active {
  transform: scale(0.9);
  opacity: 0.7;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--modal-bg);
  border: 1px solid var(--separator-opaque);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.quick-select {
  margin-bottom: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--separator);
}

.quick-select h4 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.exercise-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.exercise-quick-btn {
  padding: 0.75rem;
  background: var(--bg-light);
  color: var(--text-primary);
  border: 2px solid var(--separator);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.exercise-quick-btn:hover {
  border-color: var(--ios-blue);
  background: var(--fill-tertiary);
}

.exercise-quick-btn.selected {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.exercise-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
}

textarea {
  resize: vertical;
}

.api-search {
  margin-bottom: 2rem;
}

.api-search h4 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.search-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.search-loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-style: italic;
}

.search-error {
  background: var(--fill-tertiary);
  color: var(--text-secondary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-style: italic;
}

.api-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-light);
  border-radius: 8px;
}

.api-exercise-item {
  padding: 0.75rem;
  background: var(--card-bg);
  border: 2px solid var(--separator);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.api-exercise-item:hover {
  border-color: var(--ios-blue);
  background: var(--fill-tertiary);
}

.api-exercise-item.selected {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.api-exercise-item.selected .api-exercise-meta {
  color: rgba(255, 255, 255, 0.8);
}

.api-exercise-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.api-exercise-meta {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.instructions-display {
  background: var(--bg-light);
  padding: 1rem;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .search-filters {
    grid-template-columns: 1fr;
  }
}
</style>
