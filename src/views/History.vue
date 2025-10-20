<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
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

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="history-page">
        <header class="page-header">
          <h2>History</h2>
        </header>

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
    </div>
    <BottomNav />
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
}

.history-page {
  padding: 1.5rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

/* Tabs */
.tabs {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: var(--bg-light);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.tab-btn:hover {
  background: var(--fill-tertiary);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
}

/* Tab Content */
.tab-content {
  position: relative;
  min-height: 400px;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .history-page {
    padding: 1rem 0;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .tabs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab-btn {
    width: 100%;
  }
}
</style>
