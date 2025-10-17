import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise } from '@/types'

export const useExerciseStore = defineStore('exercise', () => {
  const exercises = ref<Exercise[]>([])

  function getTodaysExercises(): Exercise[] {
    const today = new Date().toISOString().split('T')[0]
    return exercises.value.filter(exercise => exercise.date === today)
  }

  function getTodaysCaloriesBurned(): number {
    return getTodaysExercises().reduce(
      (total, exercise) => total + exercise.caloriesBurned,
      0
    )
  }

  function getExercisesByDate(date: string): Exercise[] {
    return exercises.value.filter(exercise => exercise.date === date)
  }

  function addExercise(exercise: Omit<Exercise, 'id' | 'timestamp'>) {
    const newExercise: Exercise = {
      ...exercise,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    exercises.value.push(newExercise)
    saveToLocalStorage()
  }

  function removeExercise(id: string) {
    exercises.value = exercises.value.filter(exercise => exercise.id !== id)
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    localStorage.setItem('exercises', JSON.stringify(exercises.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('exercises')
    if (saved) {
      exercises.value = JSON.parse(saved)
    }
  }

  return {
    exercises,
    getTodaysExercises,
    getTodaysCaloriesBurned,
    getExercisesByDate,
    addExercise,
    removeExercise,
    loadFromLocalStorage
  }
})
