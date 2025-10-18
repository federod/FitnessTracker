<script setup lang="ts">
import { ref, watch } from 'vue'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'

const recipeSearchQuery = ref('')
const apiRecipes = ref<any[]>([])
const isSearchingRecipes = ref(false)
const recipeSearchError = ref('')
const selectedRecipe = ref<any | null>(null)

// Watch recipe search query
watch(recipeSearchQuery, async (newQuery) => {
  if (!newQuery || newQuery.length < 3) {
    apiRecipes.value = []
    recipeSearchError.value = ''
    return
  }

  isSearchingRecipes.value = true
  recipeSearchError.value = ''

  try {
    const response = await fetch('/.netlify/functions/claude-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: newQuery })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Recipe search failed')
    }

    apiRecipes.value = data.recipes
  } catch (error) {
    console.error('Recipe search error:', error)
    recipeSearchError.value = error instanceof Error ? error.message : 'Recipe search temporarily unavailable'
    apiRecipes.value = []
  } finally {
    isSearchingRecipes.value = false
  }
})

function selectRecipe(recipe: any) {
  selectedRecipe.value = recipe
}

function backToList() {
  selectedRecipe.value = null
}
</script>

<template>
  <div class="page-wrapper">
    <NavBar />
    <div class="container">
      <div class="recipes-page">
        <header class="page-header">
          <h2>Recipes</h2>
        </header>

        <div class="card">
          <div class="search-section">
            <input
              v-model="recipeSearchQuery"
              type="text"
              placeholder="Search recipes (type at least 3 characters)..."
              class="search-input"
            />

            <div v-if="isSearchingRecipes" class="search-status">
              <p>Searching recipes...</p>
            </div>

            <div v-if="recipeSearchError" class="search-error">
              <p>{{ recipeSearchError }}</p>
            </div>

            <div v-if="!selectedRecipe && apiRecipes.length > 0" class="recipe-list">
              <div
                v-for="recipe in apiRecipes"
                :key="recipe.title"
                @click="selectRecipe(recipe)"
                class="recipe-item"
              >
                <div class="recipe-title">{{ recipe.title }}</div>
                <div class="recipe-servings">{{ recipe.servings }}</div>
              </div>
            </div>

            <div v-if="!selectedRecipe && apiRecipes.length === 0 && !isSearchingRecipes && recipeSearchQuery.length >= 3" class="empty-state">
              No recipes found. Try a different search term.
            </div>

            <div v-if="!selectedRecipe && recipeSearchQuery.length === 0" class="empty-state">
              Start typing to search for recipes...
            </div>

            <div v-if="selectedRecipe" class="selected-recipe">
              <button @click="backToList" class="back-btn">← Back to results</button>
              <div class="recipe-details">
                <h3>{{ selectedRecipe.title }}</h3>
                <p class="servings-info">{{ selectedRecipe.servings }}</p>

                <div class="recipe-section">
                  <h4>Ingredients:</h4>
                  <ul class="ingredients-list">
                    <li v-for="(ingredient, index) in selectedRecipe.ingredients.split('|')" :key="index">
                      {{ ingredient.trim() }}
                    </li>
                  </ul>
                </div>

                <div class="recipe-section">
                  <h4>Instructions:</h4>
                  <p class="instructions-text">{{ selectedRecipe.instructions }}</p>
                </div>
              </div>
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

.recipes-page {
  padding: 1.5rem 0;
}

@media (max-width: 768px) {
  .recipes-page {
    padding: 1rem 0;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.search-section {
  padding: 1.5rem;
}

.search-input {
  width: 100%;
  margin-bottom: 1.5rem;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--separator);
  border-radius: 10px;
  background: var(--card-bg);
  color: var(--text-primary);
  transition: all 0.2s;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.search-input:focus {
  outline: none;
  border-color: var(--ios-blue);
  background: var(--bg-light);
}

.search-status {
  text-align: center;
  padding: 2rem;
  color: var(--ios-blue);
  font-style: italic;
}

.search-error {
  text-align: center;
  padding: 1rem;
  color: var(--ios-red);
  background: var(--fill-tertiary);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recipe-item {
  padding: 1.25rem;
  border: 2px solid var(--separator);
  background: var(--card-bg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.recipe-item:hover {
  border-color: var(--ios-blue);
  background: var(--fill-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recipe-title {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.recipe-servings {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-style: italic;
}

.selected-recipe {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--ios-blue);
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.back-btn:hover {
  background: var(--fill-tertiary);
}

.recipe-details h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1.75rem;
}

.servings-info {
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.recipe-section {
  margin-bottom: 2rem;
}

.recipe-section h4 {
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ingredients-list li {
  padding: 0.75rem;
  background: var(--bg-light);
  border-radius: 6px;
  color: var(--text-primary);
  display: flex;
  align-items: flex-start;
}

.ingredients-list li:before {
  content: "•";
  color: var(--primary-color);
  font-weight: bold;
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

.instructions-text {
  background: var(--bg-light);
  padding: 1.5rem;
  border-radius: 8px;
  color: var(--text-primary);
  line-height: 1.8;
  font-size: 1rem;
}
</style>
