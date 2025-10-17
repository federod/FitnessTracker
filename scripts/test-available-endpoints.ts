import { config } from 'dotenv'

config()

const apiKey = process.env.NINJA_API_KEY!

console.log('Testing which Ninja API endpoints are available...\n')

// Test Recipe API
async function testRecipe() {
  console.log('Testing Recipe API...')
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/recipe?query=pasta', {
      headers: { 'X-Api-Key': apiKey },
    })

    const data = await response.json()

    if (response.ok && Array.isArray(data) && data.length > 0) {
      console.log('✅ Recipe API works!')
      console.log('Sample:', data[0].title)
      console.log('Data structure:', JSON.stringify(data[0], null, 2))
    } else {
      console.log('❌ Recipe API not available or no data')
      console.log('Status:', response.status)
      console.log('Response:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
  console.log('')
}

// Test Exercise API
async function testExercise() {
  console.log('Testing Exercise API...')
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/exercises?type=strength&muscle=biceps', {
      headers: { 'X-Api-Key': apiKey },
    })

    const data = await response.json()

    if (response.ok && Array.isArray(data) && data.length > 0) {
      console.log('✅ Exercise API works!')
      console.log('Sample:', data[0].name)
      console.log('Data structure:', JSON.stringify(data[0], null, 2))
    } else {
      console.log('❌ Exercise API not available or no data')
      console.log('Status:', response.status)
      console.log('Response:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
  console.log('')
}

async function run() {
  await testRecipe()
  await testExercise()
}

run()
