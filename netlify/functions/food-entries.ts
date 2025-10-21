import { Handler } from '@netlify/functions'
import { getDb, foodEntries, foodItems } from '../../src/db'
import { eq, and, desc } from 'drizzle-orm'

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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
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

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Decode JWT to get user ID (you'll need to verify this with your JWT secret)
    // For now, we'll extract the user ID from the token payload
    // TODO: Add proper JWT verification with your secret
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
    const userId = payload.userId || payload.sub

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

    // GET - Fetch food entries for a date range
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {}
      const date = params.date || getLocalDateString()
      const startDate = params.startDate
      const endDate = params.endDate

      let query = db
        .select({
          id: foodEntries.id,
          foodItemId: foodEntries.foodItemId,
          servings: foodEntries.servings,
          mealType: foodEntries.mealType,
          date: foodEntries.date,
          createdAt: foodEntries.createdAt,
          foodItem: {
            id: foodItems.id,
            name: foodItems.name,
            calories: foodItems.calories,
            protein: foodItems.protein,
            carbs: foodItems.carbs,
            fat: foodItems.fat,
            servingSize: foodItems.servingSize,
          }
        })
        .from(foodEntries)
        .leftJoin(foodItems, eq(foodEntries.foodItemId, foodItems.id))
        .where(eq(foodEntries.userId, parseInt(userId)))

      if (startDate && endDate) {
        // Fetch range for weekly/monthly views
        query = query.where(
          and(
            eq(foodEntries.userId, parseInt(userId)),
            // Note: Add date range filter here with SQL
          )
        )
      } else {
        // Fetch single date
        query = query.where(
          and(
            eq(foodEntries.userId, parseInt(userId)),
            eq(foodEntries.date, date)
          )
        )
      }

      const entries = await query.orderBy(desc(foodEntries.createdAt))

      return {
        statusCode: 200,
        body: JSON.stringify({ entries }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // POST - Add new food entry
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { foodItemId, servings, mealType, date, customFood } = body

      let finalFoodItemId = foodItemId

      // If custom food is provided, create it first
      if (customFood) {
        const [newFood] = await db
          .insert(foodItems)
          .values({
            userId: parseInt(userId),
            name: customFood.name,
            calories: customFood.calories,
            protein: customFood.protein,
            carbs: customFood.carbs,
            fat: customFood.fat,
            servingSize: customFood.servingSize,
            isCustom: 1,
          })
          .returning()

        finalFoodItemId = newFood.id
      }

      const [entry] = await db
        .insert(foodEntries)
        .values({
          userId: parseInt(userId),
          foodItemId: finalFoodItemId,
          servings,
          mealType,
          date,
        })
        .returning()

      return {
        statusCode: 200,
        body: JSON.stringify({ entry }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // PUT - Update food entry
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}')
      const { id, servings, mealType } = body

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Entry ID required' }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      }

      const updateData: any = {}
      if (servings !== undefined) updateData.servings = servings
      if (mealType !== undefined) updateData.mealType = mealType

      const [updatedEntry] = await db
        .update(foodEntries)
        .set(updateData)
        .where(
          and(
            eq(foodEntries.id, parseInt(id)),
            eq(foodEntries.userId, parseInt(userId))
          )
        )
        .returning()

      if (!updatedEntry) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Entry not found' }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ entry: updatedEntry }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // DELETE - Remove food entry
    if (event.httpMethod === 'DELETE') {
      const entryId = event.queryStringParameters?.id
      if (!entryId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Entry ID required' }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      }

      await db
        .delete(foodEntries)
        .where(
          and(
            eq(foodEntries.id, parseInt(entryId)),
            eq(foodEntries.userId, parseInt(userId))
          )
        )

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Food entries error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process food entries',
        details: error instanceof Error ? error.message : String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
