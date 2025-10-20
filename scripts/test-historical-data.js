import { getDb, foodEntries, foodItems, exercises, weightHistory } from '../src/db/index.ts'
import { eq, and, sql } from 'drizzle-orm'

async function testHistoricalData() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  console.log('🔗 Testing historical data function...\n')

  const db = getDb(DATABASE_URL)
  const userId = 1 // federod2001@gmail.com
  const type = 'week'
  const date = '2025-10-20'

  try {
    console.log(`📅 Fetching ${type} data for date: ${date}`)
    console.log(`👤 User ID: ${userId}\n`)

    // Calculate date range
    let startDate, endDate
    const currentDate = new Date(date)
    console.log('📆 Current date object:', currentDate)
    console.log('📆 Day of week:', currentDate.getDay())

    if (type === 'week') {
      const dayOfWeek = currentDate.getDay()
      startDate = new Date(currentDate)
      startDate.setDate(currentDate.getDate() - dayOfWeek)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}\n`)

    // Test food entries query
    console.log('🍽️  Querying food entries...')
    const foodData = await db
      .select({
        date: foodEntries.date,
        servings: foodEntries.servings,
        calories: foodItems.calories,
        protein: foodItems.protein,
        carbs: foodItems.carbs,
        fat: foodItems.fat,
      })
      .from(foodEntries)
      .leftJoin(foodItems, eq(foodEntries.foodItemId, foodItems.id))
      .where(
        and(
          eq(foodEntries.userId, parseInt(userId)),
          sql`${foodEntries.date} >= ${startDateStr}`,
          sql`${foodEntries.date} <= ${endDateStr}`
        )
      )

    console.log(`   Found ${foodData.length} food entries:`)
    foodData.forEach(entry => {
      console.log(`   - Date: ${entry.date}, Calories: ${entry.calories}, Servings: ${entry.servings}`)
    })
    console.log('')

    // Test exercise entries query
    console.log('💪 Querying exercise entries...')
    const exerciseData = await db
      .select({
        date: exercises.date,
        caloriesBurned: exercises.caloriesBurned,
        duration: exercises.duration,
      })
      .from(exercises)
      .where(
        and(
          eq(exercises.userId, parseInt(userId)),
          sql`${exercises.date} >= ${startDateStr}`,
          sql`${exercises.date} <= ${endDateStr}`
        )
      )

    console.log(`   Found ${exerciseData.length} exercise entries:`)
    exerciseData.forEach(entry => {
      console.log(`   - Date: ${entry.date}, Burned: ${entry.caloriesBurned}, Duration: ${entry.duration}`)
    })
    console.log('')

    // Test aggregation
    console.log('📊 Testing aggregation...')
    const dailySummary = {}

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      dailySummary[dateStr] = {
        date: dateStr,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        caloriesBurned: 0,
        exerciseMinutes: 0,
        weight: null,
      }
    }

    console.log('   Initialized dates:', Object.keys(dailySummary))
    console.log('')

    // Aggregate food data
    foodData.forEach((entry) => {
      console.log(`   Processing food entry: date=${entry.date}, in summary=${!!dailySummary[entry.date]}`)
      if (entry.date && dailySummary[entry.date]) {
        const multiplier = entry.servings || 1
        dailySummary[entry.date].calories += (entry.calories || 0) * multiplier
        dailySummary[entry.date].protein += (entry.protein || 0) * multiplier
        dailySummary[entry.date].carbs += (entry.carbs || 0) * multiplier
        dailySummary[entry.date].fat += (entry.fat || 0) * multiplier
      }
    })

    // Aggregate exercise data
    exerciseData.forEach((entry) => {
      console.log(`   Processing exercise entry: date=${entry.date}, in summary=${!!dailySummary[entry.date]}`)
      if (entry.date && dailySummary[entry.date]) {
        dailySummary[entry.date].caloriesBurned += entry.caloriesBurned || 0
        dailySummary[entry.date].exerciseMinutes += entry.duration || 0
      }
    })

    const dailyData = Object.values(dailySummary)
    const totals = dailyData.reduce(
      (acc, day) => ({
        calories: acc.calories + (day.calories || 0),
        protein: acc.protein + (day.protein || 0),
        carbs: acc.carbs + (day.carbs || 0),
        fat: acc.fat + (day.fat || 0),
        caloriesBurned: acc.caloriesBurned + (day.caloriesBurned || 0),
        exerciseMinutes: acc.exerciseMinutes + (day.exerciseMinutes || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, caloriesBurned: 0, exerciseMinutes: 0 }
    )

    const daysCount = dailyData.length || 1
    const averages = {
      calories: Math.round(totals.calories / daysCount) || 0,
      protein: Math.round(totals.protein / daysCount) || 0,
      carbs: Math.round(totals.carbs / daysCount) || 0,
      fat: Math.round(totals.fat / daysCount) || 0,
      caloriesBurned: Math.round(totals.caloriesBurned / daysCount) || 0,
      exerciseMinutes: Math.round(totals.exerciseMinutes / daysCount) || 0,
    }

    console.log('\n✅ SUCCESS! Results:')
    console.log('Totals:', totals)
    console.log('Averages:', averages)
    console.log('Daily data count:', dailyData.length)

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
  }
}

testHistoricalData()
