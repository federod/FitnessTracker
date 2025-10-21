<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import type { UserProfile } from '@/types'

const userStore = useUserStore()
const authStore = useAuthStore()
const isEditingName = ref(false)
const nameInput = ref('')

const hasName = computed(() => {
  return authStore.user?.name && authStore.user.name.trim().length > 0
})

const profileForm = ref<UserProfile>({
  name: authStore.user?.name || '',
  age: 30,
  gender: 'other',
  height: 170,
  weight: 70,
  activityLevel: 'moderate',
  goal: 'maintain',
  targetWeight: 70,
  unitSystem: 'metric',
  useCustomMacros: false,
  customCalories: 0,
  customProtein: 0,
  customCarbs: 0,
  customFat: 0
})

onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.profile) {
    profileForm.value = { ...userStore.profile, name: authStore.user?.name || '' }
  } else {
    profileForm.value.name = authStore.user?.name || ''
  }
})

watch(() => userStore.profile, (newProfile) => {
  if (newProfile) {
    profileForm.value = { ...newProfile, name: authStore.user?.name || '' }
  }
})

async function saveProfile() {
  // Exclude name from profile update (name is in users table, not user_profiles)
  const { name, ...profileData } = profileForm.value
  await userStore.updateProfile(profileData)
  if (!userStore.error) {
    alert('Profile saved successfully!')
  } else {
    alert('Error saving profile: ' + userStore.error)
  }
}

function calculateBMI() {
  const heightInMeters = profileForm.value.height / 100
  const bmi = profileForm.value.weight / (heightInMeters * heightInMeters)
  return bmi.toFixed(1)
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

function applyCarnivorePreset() {
  const tdee = userStore.tdee || 2000
  // Carnivore: 70% protein, 30% fat, 0% carbs
  profileForm.value.customCalories = tdee
  profileForm.value.customProtein = Math.round((tdee * 0.7) / 4)
  profileForm.value.customCarbs = 0
  profileForm.value.customFat = Math.round((tdee * 0.3) / 9)
}

function applyKetoPreset() {
  const tdee = userStore.tdee || 2000
  // Keto: 20% protein, 5% carbs, 75% fat
  profileForm.value.customCalories = tdee
  profileForm.value.customProtein = Math.round((tdee * 0.2) / 4)
  profileForm.value.customCarbs = Math.round((tdee * 0.05) / 4)
  profileForm.value.customFat = Math.round((tdee * 0.75) / 9)
}

function startEditingName() {
  nameInput.value = authStore.user?.name || ''
  isEditingName.value = true
}

async function saveName() {
  if (!nameInput.value || nameInput.value.trim().length === 0) {
    alert('Please enter your name')
    return
  }

  const result = await authStore.updateName(nameInput.value.trim())
  if (result.success) {
    profileForm.value.name = nameInput.value.trim()
    isEditingName.value = false
    alert('Name updated successfully!')
  } else {
    alert('Error updating name: ' + (result.error || 'Unknown error'))
  }
}

function cancelEditingName() {
  isEditingName.value = false
  nameInput.value = ''
}
</script>

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="profile-page">
        <header class="page-header">
          <h2>Profile & Goals</h2>
        </header>

        <div class="profile-grid">
          <div class="card">
            <h3>Personal Information</h3>
            <form @submit.prevent="saveProfile" class="profile-form">
              <div class="form-group">
                <label>Name:</label>
                <div v-if="!isEditingName && hasName" class="name-display">
                  <input v-model="profileForm.name" type="text" readonly class="readonly-input" />
                  <button type="button" @click="startEditingName" class="edit-name-btn">Edit</button>
                </div>
                <div v-else-if="!isEditingName && !hasName" class="name-missing">
                  <p class="warning-text">⚠️ Please set your name</p>
                  <button type="button" @click="startEditingName" class="set-name-btn">Set Name</button>
                </div>
                <div v-else class="name-edit">
                  <input v-model="nameInput" type="text" placeholder="Enter your name" class="name-input" />
                  <div class="name-actions">
                    <button type="button" @click="saveName" class="save-btn">Save</button>
                    <button type="button" @click="cancelEditingName" class="cancel-btn">Cancel</button>
                  </div>
                </div>
                <span v-if="hasName && !isEditingName" class="help-text">Name is part of your account</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Age:</label>
                  <input v-model.number="profileForm.age" type="number" min="1" max="120" required />
                </div>

                <div class="form-group">
                  <label>Gender:</label>
                  <select v-model="profileForm.gender" required>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Height (cm):</label>
                  <input v-model.number="profileForm.height" type="number" min="1" required />
                </div>

                <div class="form-group">
                  <label>Weight (kg):</label>
                  <input v-model.number="profileForm.weight" type="number" min="1" step="0.1" required />
                </div>
              </div>

              <div class="form-group">
                <label>Activity Level:</label>
                <select v-model="profileForm.activityLevel" required>
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="light">Light (exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                  <option value="active">Active (exercise 6-7 days/week)</option>
                  <option value="very-active">Very Active (hard exercise daily)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Goal:</label>
                <select v-model="profileForm.goal" required>
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>

              <div class="form-group">
                <label>Unit System:</label>
                <select v-model="profileForm.unitSystem" required>
                  <option value="metric">Metric (kg, km, cm)</option>
                  <option value="imperial">Imperial (lbs, miles, inches)</option>
                </select>
              </div>

              <div v-if="profileForm.goal !== 'maintain'" class="form-group">
                <label>Target Weight (kg):</label>
                <input v-model.number="profileForm.targetWeight" type="number" min="1" step="0.1" />
              </div>

              <div class="form-group custom-macros-section">
                <div class="custom-macros-header">
                  <label class="toggle-label">
                    <span class="toggle-text">Use Custom Macro Goals</span>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="profileForm.useCustomMacros" />
                      <span class="toggle-slider"></span>
                    </label>
                  </label>
                  <span class="help-text">Perfect for carnivore, keto, or custom diets</span>
                </div>

                <div v-if="profileForm.useCustomMacros" class="custom-macros-inputs">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Daily Calories:</label>
                      <input v-model.number="profileForm.customCalories" type="number" min="0" required />
                    </div>
                    <div class="form-group">
                      <label>Protein (g):</label>
                      <input v-model.number="profileForm.customProtein" type="number" min="0" required />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Carbs (g):</label>
                      <input v-model.number="profileForm.customCarbs" type="number" min="0" required />
                    </div>
                    <div class="form-group">
                      <label>Fat (g):</label>
                      <input v-model.number="profileForm.customFat" type="number" min="0" required />
                    </div>
                  </div>
                  <div class="macro-presets">
                    <p class="presets-label">Quick Presets:</p>
                    <button type="button" @click="applyCarnivorePreset" class="preset-btn">Carnivore (High Protein)</button>
                    <button type="button" @click="applyKetoPreset" class="preset-btn">Keto (High Fat)</button>
                  </div>
                </div>
              </div>

              <button type="submit" :disabled="userStore.isLoading">
                {{ userStore.isLoading ? 'Saving...' : 'Save Profile' }}
              </button>
            </form>
          </div>

          <div class="card">
            <h3>Your Stats</h3>
            <div class="stats-section">
              <div class="stat-item">
                <div class="stat-label">BMI</div>
                <div class="stat-value">{{ calculateBMI() }}</div>
                <div class="stat-category">{{ getBMICategory(Number(calculateBMI())) }}</div>
              </div>

              <div class="stat-item">
                <div class="stat-label">BMR</div>
                <div class="stat-value">{{ Math.round(userStore.bmr) }}</div>
                <div class="stat-description">Calories burned at rest</div>
              </div>

              <div class="stat-item">
                <div class="stat-label">TDEE</div>
                <div class="stat-value">{{ userStore.tdee }}</div>
                <div class="stat-description">Total daily energy expenditure</div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Daily Goals</h3>
            <div class="goals-section">
              <div class="goal-item">
                <div class="goal-icon">🔥</div>
                <div class="goal-info">
                  <div class="goal-label">Calories</div>
                  <div class="goal-value">{{ userStore.dailyGoals.calories }} cal</div>
                </div>
              </div>

              <div class="goal-item">
                <div class="goal-icon">🥩</div>
                <div class="goal-info">
                  <div class="goal-label">Protein</div>
                  <div class="goal-value">{{ userStore.dailyGoals.protein }}g</div>
                </div>
              </div>

              <div class="goal-item">
                <div class="goal-icon">🍞</div>
                <div class="goal-info">
                  <div class="goal-label">Carbs</div>
                  <div class="goal-value">{{ userStore.dailyGoals.carbs }}g</div>
                </div>
              </div>

              <div class="goal-item">
                <div class="goal-icon">🥑</div>
                <div class="goal-info">
                  <div class="goal-label">Fat</div>
                  <div class="goal-value">{{ userStore.dailyGoals.fat }}g</div>
                </div>
              </div>
            </div>

            <div class="goals-note">
              <p><strong>Note:</strong> These goals are calculated based on your profile and activity level.</p>
              <ul>
                <li v-if="profileForm.goal === 'lose'">You have a 500 calorie deficit for weight loss</li>
                <li v-if="profileForm.goal === 'gain'">You have a 500 calorie surplus for weight gain</li>
                <li v-if="profileForm.goal === 'maintain'">Your calories are set to maintain current weight</li>
              </ul>
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
.profile-page {
  padding: 2rem 0;
}

.page-header {
  margin-bottom: 2rem;
}

.profile-grid {
  display: grid;
  gap: 1.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-light);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-category {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.goals-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: 8px;
}

.goal-icon {
  font-size: 2rem;
}

.goal-info {
  flex: 1;
}

.goal-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.goal-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-primary);
}

.goals-note {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--fill-tertiary);
  border-left: 4px solid var(--ios-blue);
  border-radius: 8px;
}

.goals-note p {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.goals-note ul {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}

.goals-note li {
  color: var(--text-secondary);
  margin: 0.25rem 0;
}

.custom-macros-section {
  border-top: 2px solid var(--separator);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.custom-macros-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-macros-header .toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
}

/* iOS-style toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--fill-tertiary);
  border: 2px solid var(--separator);
  transition: all 0.3s ease;
  border-radius: 31px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 27px;
  width: 27px;
  left: 0;
  bottom: 0;
  background-color: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--ios-green);
  border-color: var(--ios-green);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-switch:hover .toggle-slider {
  opacity: 0.9;
}

.help-text {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 400;
}

.custom-macros-inputs {
  margin-top: 1rem;
  padding: 1.5rem;
  background: var(--fill-tertiary);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.macro-presets {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid var(--separator);
}

.presets-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.preset-btn {
  padding: 0.5rem 1rem;
  background: var(--ios-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  opacity: 0.8;
}

.preset-btn:active {
  transform: scale(0.98);
}

.readonly-input {
  background: var(--fill-tertiary);
  cursor: not-allowed;
  opacity: 0.7;
}

.name-display {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.name-display input {
  flex: 1;
}

.edit-name-btn {
  padding: 0.5rem 1rem;
  background: var(--ios-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-name-btn:hover {
  opacity: 0.8;
}

.name-missing {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.warning-text {
  color: var(--ios-red);
  font-weight: 500;
  margin: 0;
}

.set-name-btn {
  padding: 0.75rem 1rem;
  background: var(--ios-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.set-name-btn:hover {
  opacity: 0.8;
}

.name-edit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.name-input {
  padding: 0.75rem;
  border: 2px solid var(--ios-blue);
  border-radius: 8px;
  font-size: 16px;
  background: var(--card-bg);
  color: var(--text-primary);
}

.name-input:focus {
  outline: none;
  border-color: var(--ios-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.name-actions {
  display: flex;
  gap: 0.75rem;
}

.save-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--ios-green);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  opacity: 0.8;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--ios-red);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .goals-section {
    grid-template-columns: 1fr;
  }
}
</style>
