<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExerciseStore } from '@/stores/exerciseStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import type { Exercise } from '@/types'

const exerciseStore = useExerciseStore()

const showAddModal = ref(false)
const exerciseForm = ref({
  name: '',
  type: 'cardio' as Exercise['type'],
  duration: 30,
  caloriesBurned: 0,
  notes: ''
})

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
})

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
    notes: ''
  }
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

.exercises-list h3 {
  margin-bottom: 1.5rem;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--card-bg);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
</style>
