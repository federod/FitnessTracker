<template>
  <div class="date-navigator">
    <button @click="previousDay" class="nav-btn" :disabled="isToday && !canGoFuture">
      <span>←</span>
    </button>

    <div class="date-display">
      <input
        type="date"
        v-model="localDate"
        @change="onDateChange"
        :max="maxDate"
        class="date-input"
      />
      <div class="date-label">{{ dateLabel }}</div>
    </div>

    <button @click="nextDay" class="nav-btn" :disabled="isToday">
      <span>→</span>
    </button>

    <button v-if="!isToday" @click="goToToday" class="today-btn">
      Today
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getLocalDateString } from '@/utils/date'

interface Props {
  modelValue: string
  canGoFuture?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canGoFuture: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localDate = ref(props.modelValue)
const today = getLocalDateString()

const maxDate = computed(() => {
  return props.canGoFuture ? undefined : today
})

const isToday = computed(() => {
  return localDate.value === today
})

const dateLabel = computed(() => {
  if (isToday.value) return 'Today'

  const [year, month, day] = localDate.value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  if (localDate.value === yesterdayStr) return 'Yesterday'

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
})

watch(() => props.modelValue, (newValue) => {
  localDate.value = newValue
})

function previousDay() {
  const [year, month, day] = localDate.value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - 1)

  const newDate = getLocalDateString(date)
  localDate.value = newDate
  emit('update:modelValue', newDate)
}

function nextDay() {
  const [year, month, day] = localDate.value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 1)

  const newDate = getLocalDateString(date)
  if (!props.canGoFuture && newDate > today) return

  localDate.value = newDate
  emit('update:modelValue', newDate)
}

function goToToday() {
  localDate.value = today
  emit('update:modelValue', today)
}

function onDateChange() {
  emit('update:modelValue', localDate.value)
}
</script>

<style scoped>
.date-navigator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.nav-btn {
  background: var(--fill-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ios-blue);
  font-size: 1.25rem;
  transition: all 0.2s;
  padding: 0;
}

.nav-btn:hover:not(:disabled) {
  background: var(--ios-blue);
  color: white;
  transform: scale(1.05);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-display {
  flex: 1;
  text-align: center;
  position: relative;
}

.date-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.date-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
  padding: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.today-btn {
  background: var(--ios-blue);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.today-btn:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .date-navigator {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .date-label {
    font-size: 0.9rem;
  }

  .today-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>
