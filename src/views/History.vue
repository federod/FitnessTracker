<template>
  <div class="history-page">
    <div class="page-header">
      <h1>History</h1>
      <p class="subtitle">View your fitness progress over time</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <transition name="fade" mode="out-in">
        <WeeklySummary v-if="activeTab === 'week'" key="week" />
        <MonthlySummary v-else-if="activeTab === 'month'" key="month" />
        <WeightTracker v-else-if="activeTab === 'weight'" key="weight" />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WeeklySummary from '@/components/WeeklySummary.vue'
import MonthlySummary from '@/components/MonthlySummary.vue'
import WeightTracker from '@/components/WeightTracker.vue'

interface Tab {
  id: string
  label: string
}

const tabs: Tab[] = [
  { id: 'week', label: 'Weekly Summary' },
  { id: 'month', label: 'Monthly Summary' },
  { id: 'weight', label: 'Weight Tracker' }
]

const activeTab = ref('week')
</script>

<style scoped>
.history-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Tabs */
.tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 0 1rem;
}

.tab-btn {
  padding: 0.875rem 1.75rem;
  border: 2px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);
  position: relative;
  overflow: hidden;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

.tab-btn span {
  position: relative;
  z-index: 1;
}

.tab-btn:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.tab-btn.active::before {
  opacity: 1;
}

/* Tab Content */
.tab-content {
  position: relative;
  min-height: 400px;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .history-page {
    padding: 1.5rem 0.5rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .tabs {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0;
  }

  .tab-btn {
    width: 100%;
    padding: 1rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tab-btn {
    background: var(--card-bg, #1e293b);
    border-color: var(--border-color, #334155);
  }

  .tab-btn:hover:not(.active) {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .tab-btn.active {
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
  }
}
</style>
