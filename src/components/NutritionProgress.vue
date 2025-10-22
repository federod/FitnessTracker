<script setup lang="ts">
import { computed } from 'vue'
import type { NutritionSummary, DailyGoals } from '@/types'

const props = defineProps<{
  current: NutritionSummary
  goals: DailyGoals
}>()

const proteinPercentage = computed(() => {
  return Math.min((props.current.protein / props.goals.protein) * 100, 100)
})

const carbsPercentage = computed(() => {
  return Math.min((props.current.carbs / props.goals.carbs) * 100, 100)
})

const fatPercentage = computed(() => {
  return Math.min((props.current.fat / props.goals.fat) * 100, 100)
})

const remainingCalories = computed(() => {
  return props.goals.calories - props.current.calories
})
</script>

<template>
  <div class="nutrition-progress">
    <div class="calories-summary">
      <div class="calories-card">
        <div class="calories-display">
          <span class="calories-current">{{ Math.round(current.calories) }}</span>
          <span class="calories-divider">/</span>
          <span class="calories-goal">{{ goals.calories }}</span>
        </div>
        <div class="calories-label">CALORIES</div>
        <div class="calories-remaining" :class="{ over: remainingCalories < 0 }">
          {{ Math.abs(remainingCalories) }} {{ remainingCalories > 0 ? 'remaining' : 'over' }}
        </div>
      </div>
    </div>

    <div class="macro-bars">
      <div class="macro-item">
        <div class="macro-header">
          <span class="macro-name">Protein</span>
          <span class="macro-value">{{ Math.round(current.protein) }}g / {{ goals.protein }}g</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill protein" :style="{ width: `${proteinPercentage}%` }"></div>
        </div>
      </div>

      <div class="macro-item">
        <div class="macro-header">
          <span class="macro-name">Carbs</span>
          <span class="macro-value">{{ Math.round(current.carbs) }}g / {{ goals.carbs }}g</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill carbs" :style="{ width: `${carbsPercentage}%` }"></div>
        </div>
      </div>

      <div class="macro-item">
        <div class="macro-header">
          <span class="macro-name">Fat</span>
          <span class="macro-value">{{ Math.round(current.fat) }}g / {{ goals.fat }}g</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill fat" :style="{ width: `${fatPercentage}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nutrition-progress {
  width: 100%;
}

.calories-summary {
  text-align: center;
  margin-bottom: 2.5rem;
}

.calories-card {
  background: var(--fill-secondary);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.calories-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.75rem;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.calories-current {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--ios-blue);
  letter-spacing: -1.5px;
}

.calories-divider {
  font-size: 2.5rem;
  font-weight: 300;
  color: var(--text-tertiary);
}

.calories-goal {
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: -1.5px;
}

.calories-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.calories-remaining {
  font-size: 1.125rem;
  color: var(--ios-green);
  font-weight: 600;
}

.calories-remaining.over {
  color: var(--ios-red);
}

.macro-bars {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.macro-item {
  width: 100%;
}

.macro-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.macro-name {
  font-weight: 600;
  color: var(--text-primary);
}

.macro-value {
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--fill-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
}

.progress-fill.protein {
  background: var(--ios-pink);
}

.progress-fill.carbs {
  background: var(--ios-teal);
}

.progress-fill.fat {
  background: var(--ios-orange);
}
</style>
