import { Handler } from '@netlify/functions'
import { getDb, foodEntries, foodItems, exercises, weightHistory } from '../../src/db'
import { eq, and, sql } from 'drizzle-orm'

// Helper to get local date string (not UTC)
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }

  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database URL not configured' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }

  const db = getDb(DATABASE_URL)

  let userId: string | undefined
  let params: Record<string, string> = {}

  try {
    // Extract and verify JWT token
    const authHeader = event.headers['authorization'] || event.headers['Authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized - No token provided' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    const token = authHeader.substring(7)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token format' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    userId = payload.userId || payload.sub

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token - no user ID' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    params = event.queryStringParameters || {}
    const type = params.type || 'week' // 'week' or 'month'
    const date = params.date || getLocalDateString()

    console.log('Historical data request:', { userId, type, date })

    // Calculate date range based on type
    let startDate, endDate
    const currentDate = new Date(date)

    if (type === 'week') {
      // Get start of week (Sunday)
      const dayOfWeek = currentDate.getDay()
      startDate = new Date(currentDate)
      startDate.setDate(currentDate.getDate() - dayOfWeek)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else if (type === 'month') {
      // Get start and end of month
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid type. Use "week" or "month"' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    const startDateStr = getLocalDateString(startDate)
    const endDateStr = getLocalDateString(endDate)

    // Fetch food entries with items
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

    // Fetch exercise entries
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

    // Fetch weight entries
    const weightData = await db
      .select()
      .from(weightHistory)
      .where(
        and(
          eq(weightHistory.userId, parseInt(userId)),
          sql`${weightHistory.date} >= ${startDateStr}`,
          sql`${weightHistory.date} <= ${endDateStr}`
        )
      )
      .orderBy(weightHistory.date)

    // Aggregate data by date
    const dailySummary: Record<string, any> = {}

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = getLocalDateString(d)
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

    // Aggregate food data
    foodData.forEach((entry) => {
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
      if (entry.date && dailySummary[entry.date]) {
        dailySummary[entry.date].caloriesBurned += entry.caloriesBurned || 0
        dailySummary[entry.date].exerciseMinutes += entry.duration || 0
      }
    })

    // Add weight data
    weightData.forEach((entry) => {
      if (entry.date && dailySummary[entry.date]) {
        dailySummary[entry.date].weight = entry.weight
      }
    })

    // Convert to array and calculate totals
    const dailyData = Object.values(dailySummary)
    const totals = dailyData.reduce(
      (acc, day: any) => ({
        calories: acc.calories + (day.calories || 0),
        protein: acc.protein + (day.protein || 0),
        carbs: acc.carbs + (day.carbs || 0),
        fat: acc.fat + (day.fat || 0),
        caloriesBurned: acc.caloriesBurned + (day.caloriesBurned || 0),
        exerciseMinutes: acc.exerciseMinutes + (day.exerciseMinutes || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, caloriesBurned: 0, exerciseMinutes: 0 }
    )

    const daysCount = dailyData.length || 1 // Prevent division by zero
    const averages = {
      calories: Math.round(totals.calories / daysCount) || 0,
      protein: Math.round(totals.protein / daysCount) || 0,
      carbs: Math.round(totals.carbs / daysCount) || 0,
      fat: Math.round(totals.fat / daysCount) || 0,
      caloriesBurned: Math.round(totals.caloriesBurned / daysCount) || 0,
      exerciseMinutes: Math.round(totals.exerciseMinutes / daysCount) || 0,
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        type,
        startDate: startDateStr,
        endDate: endDateStr,
        dailyData,
        totals,
        averages,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Historical data error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('User ID:', userId)
    console.error('Query params:', params)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch historical data',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
