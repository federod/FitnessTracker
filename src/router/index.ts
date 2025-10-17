import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/food-log',
    name: 'food-log',
    component: () => import('@/views/FoodLog.vue')
  },
  {
    path: '/exercise',
    name: 'exercise',
    component: () => import('@/views/Exercise.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
