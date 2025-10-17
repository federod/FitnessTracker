<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import type { UserProfile } from '@/types'

const userStore = useUserStore()
const authStore = useAuthStore()

const profileForm = ref<UserProfile>({
  name: authStore.user?.name || '',
  age: 30,
  gender: 'other',
  height: 170,
  weight: 70,
  activityLevel: 'moderate',
  goal: 'maintain',
  targetWeight: 70
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
  await userStore.updateProfile(profileForm.value)
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
                <input v-model="profileForm.name" type="text" required />
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

              <div v-if="profileForm.goal !== 'maintain'" class="form-group">
                <label>Target Weight (kg):</label>
                <input v-model.number="profileForm.targetWeight" type="number" min="1" step="0.1" />
              </div>

              <button type="submit">Save Profile</button>
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
