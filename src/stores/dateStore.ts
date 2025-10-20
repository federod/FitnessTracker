import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLocalDateString } from '@/utils/date'

export const useDateStore = defineStore('date', () => {
  // Selected date shared across all pages
  const selectedDate = ref(getLocalDateString())

  function setDate(date: string) {
    selectedDate.value = date
  }

  function goToToday() {
    selectedDate.value = getLocalDateString()
  }

  function previousDay() {
    const [year, month, day] = selectedDate.value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() - 1)
    selectedDate.value = getLocalDateString(date)
  }

  function nextDay() {
    const [year, month, day] = selectedDate.value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() + 1)

    const today = getLocalDateString()
    const newDate = getLocalDateString(date)

    // Don't go into the future
    if (newDate <= today) {
      selectedDate.value = newDate
    }
  }

  function isToday() {
    return selectedDate.value === getLocalDateString()
  }

  return {
    selectedDate,
    setDate,
    goToToday,
    previousDay,
    nextDay,
    isToday
  }
})
