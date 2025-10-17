import { config } from 'dotenv'

config()

const apiKey = process.env.NINJA_API_KEY

if (!apiKey) {
  console.error('❌ NINJA_API_KEY not found in environment variables')
  process.exit(1)
}

console.log('✓ API Key found in .env')
console.log('Testing Ninja API endpoints...\n')

// Test 1: Nutrition API
async function testNutrition() {
  console.log('1. Testing Nutrition API...')
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/nutrition?query=chicken breast', {
      headers: {
        'X-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('   ✅ Nutrition API working!')
    console.log('   Sample result:', data[0]?.name || 'No data')
    console.log('')
    return true
  } catch (error) {
    console.error('   ❌ Nutrition API failed:', error instanceof Error ? error.message : error)
    console.log('')
    return false
  }
}

// Test 2: Recipe API
async function testRecipe() {
  console.log('2. Testing Recipe API...')
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/recipe?query=pasta', {
      headers: {
        'X-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('   ✅ Recipe API working!')
    console.log('   Sample result:', data[0]?.title || 'No data')
    console.log('')
    return true
  } catch (error) {
    console.error('   ❌ Recipe API failed:', error instanceof Error ? error.message : error)
    console.log('')
    return false
  }
}

// Test 3: Exercise API
async function testExercise() {
  console.log('3. Testing Exercise API...')
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/exercises?muscle=biceps', {
      headers: {
        'X-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('   ✅ Exercise API working!')
    console.log('   Sample result:', data[0]?.name || 'No data')
    console.log('')
    return true
  } catch (error) {
    console.error('   ❌ Exercise API failed:', error instanceof Error ? error.message : error)
    console.log('')
    return false
  }
}

// Run all tests
async function runTests() {
  const nutritionOk = await testNutrition()
  const recipeOk = await testRecipe()
  const exerciseOk = await testExercise()

  console.log('=' .repeat(50))
  if (nutritionOk && recipeOk && exerciseOk) {
    console.log('🎉 All API endpoints working correctly!')
    console.log('Your Ninja API key is valid and ready to use.')
  } else {
    console.log('⚠️  Some API endpoints failed.')
    console.log('Please check your API key or API limits.')
  }
  console.log('=' .repeat(50))
}

runTests()
