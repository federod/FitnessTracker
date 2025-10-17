<script setup lang="ts">
import { computed } from 'vue'
import type { NutritionSummary, DailyGoals } from '@/types'

const props = defineProps<{
  current: NutritionSummary
  goals: DailyGoals
}>()

const caloriesPercentage = computed(() => {
  return Math.min((props.current.calories / props.goals.calories) * 100, 100)
})

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
      <div class="calories-main">
        <div class="calories-number">{{ Math.round(current.calories) }}</div>
        <div class="calories-label">/ {{ goals.calories }} calories</div>
      </div>
      <div class="calories-remaining" :class="{ over: remainingCalories < 0 }">
        {{ remainingCalories > 0 ? remainingCalories : Math.abs(remainingCalories) }}
        {{ remainingCalories > 0 ? 'remaining' : 'over' }}
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
  margin-bottom: 2rem;
}

.calories-main {
  margin-bottom: 0.5rem;
}

.calories-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--ios-blue);
  letter-spacing: -2px;
}

.calories-label {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.calories-remaining {
  font-size: 1rem;
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
