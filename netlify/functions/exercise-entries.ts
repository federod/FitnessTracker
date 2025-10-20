import { Handler } from '@netlify/functions'
import { getDb, exercises } from '../../src/db'
import { eq, and, desc, sql } from 'drizzle-orm'

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

    // GET - Fetch exercise entries
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {}
      const date = params.date || new Date().toISOString().split('T')[0]
      const startDate = params.startDate
      const endDate = params.endDate

      let whereClause
      if (startDate && endDate) {
        // Fetch range for weekly/monthly views
        whereClause = and(
          eq(exercises.userId, parseInt(userId)),
          sql`${exercises.date} >= ${startDate}`,
          sql`${exercises.date} <= ${endDate}`
        )
      } else {
        // Fetch single date
        whereClause = and(
          eq(exercises.userId, parseInt(userId)),
          eq(exercises.date, date)
        )
      }

      const entries = await db
        .select()
        .from(exercises)
        .where(whereClause)
        .orderBy(desc(exercises.createdAt))

      return {
        statusCode: 200,
        body: JSON.stringify({ exercises: entries }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // POST - Add new exercise entry
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { name, type, duration, caloriesBurned, date, notes } = body

      const [entry] = await db
        .insert(exercises)
        .values({
          userId: parseInt(userId),
          name,
          type,
          duration,
          caloriesBurned,
          date,
          notes: notes || null,
        })
        .returning()

      return {
        statusCode: 200,
        body: JSON.stringify({ exercise: entry }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // DELETE - Remove exercise entry
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
        .delete(exercises)
        .where(
          and(
            eq(exercises.id, parseInt(entryId)),
            eq(exercises.userId, parseInt(userId))
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
    console.error('Exercise entries error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process exercise entries',
        details: error instanceof Error ? error.message : String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
