<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useFoodStore } from '@/stores/foodStore'
import { useUserStore } from '@/stores/userStore'
import { useDateStore } from '@/stores/dateStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import NutritionProgress from '@/components/NutritionProgress.vue'
import DateNavigator from '@/components/DateNavigator.vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import type { FoodItem } from '@/types'

const foodStore = useFoodStore()
const userStore = useUserStore()
const dateStore = useDateStore()
const showAddModal = ref(false)
const showEditModal = ref(false)
const showBarcodeScanner = ref(false)
const editingEntry = ref<any>(null)
const selectedFood = ref<FoodItem | null>(null)
const servings = ref(1)
const selectedMeal = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
const searchQuery = ref('')
const apiResults = ref<FoodItem[]>([])
const isSearching = ref(false)
const searchError = ref('')

const showCustomFoodModal = ref(false)
const customFood = ref({
  name: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  servingSize: ''
})

onMounted(() => {
  userStore.fetchProfile()
  loadDataForDate(dateStore.selectedDate)
})

watch(() => dateStore.selectedDate, (newDate) => {
  loadDataForDate(newDate)
})

async function loadDataForDate(date: string) {
  await foodStore.fetchEntriesByDate(date)
}

const todaysSummary = computed(() => {
  const entries = foodStore.foodEntries.filter(entry => entry.date === dateStore.selectedDate)
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

const filteredFoods = computed(() => {
  // If we have API results, show those
  if (apiResults.value.length > 0) {
    return apiResults.value
  }

  // Only show foods when user is actively searching
  if (!searchQuery.value) return []

  return foodStore.commonFoods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Watch search query and call Claude API
watch(searchQuery, async (newQuery) => {
  if (!newQuery || newQuery.length < 3) {
    apiResults.value = []
    searchError.value = ''
    return
  }

  isSearching.value = true
  searchError.value = ''

  try {
    const response = await fetch('/.netlify/functions/claude-nutrition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ foodQuery: newQuery })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Search failed')
    }

    // Convert Claude API response to our FoodItem format
    const nutrition = data.nutrition
    apiResults.value = [{
      id: `api-${Date.now()}`,
      name: nutrition.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      servingSize: nutrition.serving_size
    }]
  } catch (error) {
    console.error('Search error:', error)
    searchError.value = error instanceof Error ? error.message : 'Nutrition search temporarily unavailable'
    apiResults.value = []
  } finally {
    isSearching.value = false
  }
})

const breakfastEntries = computed(() =>
  foodStore.foodEntries.filter(e => e.mealType === 'breakfast' && e.date === dateStore.selectedDate)
)
const lunchEntries = computed(() =>
  foodStore.foodEntries.filter(e => e.mealType === 'lunch' && e.date === dateStore.selectedDate)
)
const dinnerEntries = computed(() =>
  foodStore.foodEntries.filter(e => e.mealType === 'dinner' && e.date === dateStore.selectedDate)
)
const snackEntries = computed(() =>
  foodStore.foodEntries.filter(e => e.mealType === 'snack' && e.date === dateStore.selectedDate)
)

function openAddModal(meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
  selectedMeal.value = meal
  showAddModal.value = true
}

function selectFood(food: FoodItem) {
  selectedFood.value = food
}

function addFood() {
  if (!selectedFood.value) return

  foodStore.addFoodEntry({
    foodItem: selectedFood.value,
    servings: servings.value,
    mealType: selectedMeal.value,
    date: dateStore.selectedDate
  })

  closeAddModal()
}

function closeAddModal() {
  showAddModal.value = false
  selectedFood.value = null
  servings.value = 1
  searchQuery.value = ''
  apiResults.value = []
  searchError.value = ''
}

function openEditModal(entry: any) {
  editingEntry.value = entry
  servings.value = entry.servings
  selectedMeal.value = entry.mealType
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingEntry.value = null
  servings.value = 1
}

async function updateEntry() {
  if (!editingEntry.value) return

  const result = await foodStore.updateFoodEntry(editingEntry.value.id, {
    servings: servings.value,
    mealType: selectedMeal.value
  })

  if (result.success) {
    closeEditModal()
  }
}

function removeEntry(id: string) {
  if (confirm('Are you sure you want to remove this entry?')) {
    foodStore.removeFoodEntry(id)
  }
}

function addCustomFood() {
  foodStore.addCustomFood(customFood.value)
  customFood.value = {
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: ''
  }
  showCustomFoodModal.value = false
}

function openBarcodeScanner(meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
  selectedMeal.value = meal
  showBarcodeScanner.value = true
}

function handleScannedFood(food: FoodItem) {
  showBarcodeScanner.value = false
  selectedFood.value = food
  servings.value = 1
  showAddModal.value = true
}
</script>

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="food-log">
        <header class="page-header">
          <h2>Food Log</h2>
          <div class="header-actions">
            <button @click="showCustomFoodModal = true" class="secondary-btn">
              + Custom Food
            </button>
          </div>
        </header>

        <DateNavigator />

        <div class="card">
          <div class="card-header">
            <h3>Today's Progress</h3>
            <span class="card-icon">📈</span>
          </div>
          <NutritionProgress :current="todaysSummary" :goals="dailyGoals" />
        </div>

        <div class="meals-section">
          <div class="meal-card card">
            <div class="meal-header">
              <h3>Breakfast</h3>
              <div class="meal-actions">
                <button @click="openBarcodeScanner('breakfast')" class="scan-btn" title="Scan barcode">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="2" height="12"/>
                    <rect x="6" y="6" width="1" height="12"/>
                    <rect x="9" y="6" width="3" height="12"/>
                    <rect x="14" y="6" width="1" height="12"/>
                    <rect x="17" y="6" width="2" height="12"/>
                    <rect x="21" y="6" width="1" height="12"/>
                  </svg>
                </button>
                <button @click="openAddModal('breakfast')">+ Add</button>
              </div>
            </div>
            <div v-if="breakfastEntries.length === 0" class="empty-meal">
              No food logged yet
            </div>
            <div v-else class="food-entries">
              <div v-for="entry in breakfastEntries" :key="entry.id" class="food-entry">
                <div class="entry-info">
                  <div class="entry-name">{{ entry.foodItem.name }}</div>
                  <div class="entry-details">
                    {{ entry.servings }} x {{ entry.foodItem.servingSize }}
                  </div>
                </div>
                <div class="entry-nutrition">
                  <span>{{ Math.round(entry.foodItem.calories * entry.servings) }} cal</span>
                </div>
                <div class="entry-actions">
                  <button @click="openEditModal(entry)" class="edit-btn">✎</button>
                  <button @click="removeEntry(entry.id)" class="delete-btn">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="meal-card card">
            <div class="meal-header">
              <h3>Lunch</h3>
              <div class="meal-actions">
                <button @click="openBarcodeScanner('lunch')" class="scan-btn" title="Scan barcode">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="2" height="12"/>
                    <rect x="6" y="6" width="1" height="12"/>
                    <rect x="9" y="6" width="3" height="12"/>
                    <rect x="14" y="6" width="1" height="12"/>
                    <rect x="17" y="6" width="2" height="12"/>
                    <rect x="21" y="6" width="1" height="12"/>
                  </svg>
                </button>
                <button @click="openAddModal('lunch')">+ Add</button>
              </div>
            </div>
            <div v-if="lunchEntries.length === 0" class="empty-meal">
              No food logged yet
            </div>
            <div v-else class="food-entries">
              <div v-for="entry in lunchEntries" :key="entry.id" class="food-entry">
                <div class="entry-info">
                  <div class="entry-name">{{ entry.foodItem.name }}</div>
                  <div class="entry-details">
                    {{ entry.servings }} x {{ entry.foodItem.servingSize }}
                  </div>
                </div>
                <div class="entry-nutrition">
                  <span>{{ Math.round(entry.foodItem.calories * entry.servings) }} cal</span>
                </div>
                <div class="entry-actions">
                  <button @click="openEditModal(entry)" class="edit-btn">✎</button>
                  <button @click="removeEntry(entry.id)" class="delete-btn">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="meal-card card">
            <div class="meal-header">
              <h3>Dinner</h3>
              <div class="meal-actions">
                <button @click="openBarcodeScanner('dinner')" class="scan-btn" title="Scan barcode">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="2" height="12"/>
                    <rect x="6" y="6" width="1" height="12"/>
                    <rect x="9" y="6" width="3" height="12"/>
                    <rect x="14" y="6" width="1" height="12"/>
                    <rect x="17" y="6" width="2" height="12"/>
                    <rect x="21" y="6" width="1" height="12"/>
                  </svg>
                </button>
                <button @click="openAddModal('dinner')">+ Add</button>
              </div>
            </div>
            <div v-if="dinnerEntries.length === 0" class="empty-meal">
              No food logged yet
            </div>
            <div v-else class="food-entries">
              <div v-for="entry in dinnerEntries" :key="entry.id" class="food-entry">
                <div class="entry-info">
                  <div class="entry-name">{{ entry.foodItem.name }}</div>
                  <div class="entry-details">
                    {{ entry.servings }} x {{ entry.foodItem.servingSize }}
                  </div>
                </div>
                <div class="entry-nutrition">
                  <span>{{ Math.round(entry.foodItem.calories * entry.servings) }} cal</span>
                </div>
                <div class="entry-actions">
                  <button @click="openEditModal(entry)" class="edit-btn">✎</button>
                  <button @click="removeEntry(entry.id)" class="delete-btn">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="meal-card card">
            <div class="meal-header">
              <h3>Snacks</h3>
              <div class="meal-actions">
                <button @click="openBarcodeScanner('snack')" class="scan-btn" title="Scan barcode">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="2" height="12"/>
                    <rect x="6" y="6" width="1" height="12"/>
                    <rect x="9" y="6" width="3" height="12"/>
                    <rect x="14" y="6" width="1" height="12"/>
                    <rect x="17" y="6" width="2" height="12"/>
                    <rect x="21" y="6" width="1" height="12"/>
                  </svg>
                </button>
                <button @click="openAddModal('snack')">+ Add</button>
              </div>
            </div>
            <div v-if="snackEntries.length === 0" class="empty-meal">
              No food logged yet
            </div>
            <div v-else class="food-entries">
              <div v-for="entry in snackEntries" :key="entry.id" class="food-entry">
                <div class="entry-info">
                  <div class="entry-name">{{ entry.foodItem.name }}</div>
                  <div class="entry-details">
                    {{ entry.servings }} x {{ entry.foodItem.servingSize }}
                  </div>
                </div>
                <div class="entry-nutrition">
                  <span>{{ Math.round(entry.foodItem.calories * entry.servings) }} cal</span>
                </div>
                <div class="entry-actions">
                  <button @click="openEditModal(entry)" class="edit-btn">✎</button>
                  <button @click="removeEntry(entry.id)" class="delete-btn">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <BottomNav />

    <!-- Add Food Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Food to {{ selectedMeal }}</h3>
          <button @click="closeAddModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search foods (type at least 3 characters)..."
            class="search-input"
          />

          <div v-if="isSearching" class="search-status">
            <p>Searching nutrition database...</p>
          </div>

          <div v-if="searchError" class="search-error">
            <p>{{ searchError }}</p>
          </div>

          <div v-if="!selectedFood" class="food-list">
            <div
              v-for="food in filteredFoods"
              :key="food.id"
              @click="selectFood(food)"
              class="food-item"
            >
              <div class="food-item-name">{{ food.name }}</div>
              <div class="food-item-serving">{{ food.servingSize }}</div>
              <div class="food-item-nutrition">
                {{ food.calories }} cal | P: {{ food.protein }}g | C: {{ food.carbs }}g | F: {{ food.fat }}g
              </div>
            </div>
          </div>

          <div v-else class="selected-food">
            <button @click="selectedFood = null" class="back-btn">← Back to list</button>
            <div class="food-details">
              <h4>{{ selectedFood.name }}</h4>
              <p>{{ selectedFood.servingSize }}</p>
              <div class="nutrition-info">
                <div class="nutrition-item">
                  <span class="label">Calories:</span>
                  <span class="value">{{ selectedFood.calories }}</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Protein:</span>
                  <span class="value">{{ selectedFood.protein }}g</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Carbs:</span>
                  <span class="value">{{ selectedFood.carbs }}g</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Fat:</span>
                  <span class="value">{{ selectedFood.fat }}g</span>
                </div>
              </div>

              <div class="servings-input">
                <label>Servings:</label>
                <input v-model.number="servings" type="number" min="0.1" step="0.1" />
              </div>

              <div class="total-nutrition">
                <h5>Total:</h5>
                <p>{{ Math.round(selectedFood.calories * servings) }} calories</p>
                <p>P: {{ Math.round(selectedFood.protein * servings) }}g |
                   C: {{ Math.round(selectedFood.carbs * servings) }}g |
                   F: {{ Math.round(selectedFood.fat * servings) }}g</p>
              </div>

              <button @click="addFood" class="add-btn">Add to {{ selectedMeal }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Food Modal -->
    <div v-if="showCustomFoodModal" class="modal-overlay" @click="showCustomFoodModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Custom Food</h3>
          <button @click="showCustomFoodModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addCustomFood" class="custom-food-form">
            <div class="form-group">
              <label>Food Name:</label>
              <input v-model="customFood.name" type="text" required />
            </div>
            <div class="form-group">
              <label>Serving Size:</label>
              <input v-model="customFood.servingSize" type="text" required placeholder="e.g., 100g, 1 cup" />
            </div>
            <div class="form-group">
              <label>Calories:</label>
              <input v-model.number="customFood.calories" type="number" required min="0" />
            </div>
            <div class="form-group">
              <label>Protein (g):</label>
              <input v-model.number="customFood.protein" type="number" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>Carbs (g):</label>
              <input v-model.number="customFood.carbs" type="number" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>Fat (g):</label>
              <input v-model.number="customFood.fat" type="number" required min="0" step="0.1" />
            </div>
            <button type="submit">Add Food</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Food Entry Modal -->
    <div v-if="showEditModal && editingEntry" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Food Entry</h3>
          <button @click="closeEditModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="edit-entry-form">
            <div class="food-details">
              <h4>{{ editingEntry.foodItem.name }}</h4>
              <p>{{ editingEntry.foodItem.servingSize }}</p>
              <div class="nutrition-info">
                <div class="nutrition-item">
                  <span class="label">Calories:</span>
                  <span class="value">{{ editingEntry.foodItem.calories }}</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Protein:</span>
                  <span class="value">{{ editingEntry.foodItem.protein }}g</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Carbs:</span>
                  <span class="value">{{ editingEntry.foodItem.carbs }}g</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Fat:</span>
                  <span class="value">{{ editingEntry.foodItem.fat }}g</span>
                </div>
              </div>

              <div class="form-group">
                <label>Servings:</label>
                <input v-model.number="servings" type="number" min="0.1" step="0.1" />
              </div>

              <div class="form-group">
                <label>Meal Type:</label>
                <select v-model="selectedMeal">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div class="total-nutrition">
                <h5>Total:</h5>
                <p>{{ Math.round(editingEntry.foodItem.calories * servings) }} calories</p>
                <p>P: {{ Math.round(editingEntry.foodItem.protein * servings) }}g |
                   C: {{ Math.round(editingEntry.foodItem.carbs * servings) }}g |
                   F: {{ Math.round(editingEntry.foodItem.fat * servings) }}g</p>
              </div>

              <button @click="updateEntry" class="add-btn">Update Entry</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barcode Scanner Modal -->
    <BarcodeScanner
      v-if="showBarcodeScanner"
      @close="showBarcodeScanner = false"
      @food-found="handleScannedFood"
    />
  </div>
</template>

<style scoped>
.food-log {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.page-wrapper {
  min-height: 100vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.card-icon {
  font-size: 1.75rem;
}

.secondary-btn {
  background: rgba(142, 142, 147, 0.12);
  color: var(--ios-blue);
  font-size: 0.9rem;
  padding: 0.675rem 1.25rem;
  border: 1px solid var(--separator);
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: rgba(142, 142, 147, 0.18);
}

@media (max-width: 768px) {
  .page-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .page-header h2 {
    flex: 1;
  }

  .secondary-btn {
    font-size: 0.85rem;
    padding: 0.625rem 1rem;
  }

  .meals-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.meals-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.meal-header h3 {
  margin: 0;
}

.meal-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.scan-btn {
  background: var(--ios-blue);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 36px;
}

.scan-btn svg {
  width: 20px;
  height: 20px;
}

.scan-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.scan-btn:active {
  transform: translateY(0);
  opacity: 0.8;
}

.empty-meal {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.food-entries {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.food-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-light);
  border-radius: 4px;
  gap: 1rem;
}

.entry-info {
  flex: 1;
}

.entry-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.entry-details {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.entry-nutrition {
  font-weight: 500;
  color: var(--primary-color);
}

.entry-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-btn {
  background: var(--ios-blue);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  min-height: 32px;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all var(--transition-fast);
}

.edit-btn:active {
  transform: scale(0.9);
  opacity: 0.7;
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
  text-transform: capitalize;
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

.search-input {
  width: 100%;
  margin-bottom: 1rem;
}

.search-status {
  text-align: center;
  padding: 1rem;
  color: var(--ios-blue);
  font-style: italic;
}

.search-error {
  text-align: center;
  padding: 1rem;
  color: var(--ios-red);
  background: var(--fill-tertiary);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.food-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.food-item {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.food-item:hover {
  background: var(--bg-light);
}

.food-item-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.food-item-serving {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.food-item-nutrition {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.selected-food {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
}

.food-details h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.nutrition-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--bg-light);
  border-radius: 4px;
}

.servings-input {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.servings-input input {
  width: 100px;
}

.total-nutrition {
  background: var(--bg-light);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.total-nutrition h5 {
  margin-top: 0;
  color: var(--text-primary);
}

.add-btn {
  width: 100%;
  text-transform: capitalize;
}

.custom-food-form {
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

.edit-entry-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-entry-form .food-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-entry-form .food-details h4 {
  margin: 0;
  color: var(--text-primary);
}

.edit-entry-form .food-details p {
  margin: 0;
  color: var(--text-secondary);
}

.edit-entry-form .form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
  color: var(--text-primary);
  font-size: 1rem;
}
</style>
