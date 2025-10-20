<template>
  <div class="date-navigator">
    <button @click="dateStore.previousDay()" class="nav-btn">
      <span>←</span>
    </button>

    <div class="date-display">
      <input
        type="date"
        v-model="dateStore.selectedDate"
        :max="maxDate"
        class="date-input"
      />
      <div class="date-label">{{ dateLabel }}</div>
    </div>

    <button @click="dateStore.nextDay()" class="nav-btn" :disabled="dateStore.isToday()">
      <span>→</span>
    </button>

    <button v-if="!dateStore.isToday()" @click="dateStore.goToToday()" class="today-btn">
      Today
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import { getLocalDateString } from '@/utils/date'

const dateStore = useDateStore()
const today = getLocalDateString()

const maxDate = computed(() => today)

const dateLabel = computed(() => {
  if (dateStore.isToday()) return 'Today'

  const [year, month, day] = dateStore.selectedDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  if (dateStore.selectedDate === yesterdayStr) return 'Yesterday'

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
})
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
