import { Handler } from '@netlify/functions'
import { getDb, weightHistory, userProfiles } from '../../src/db'
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

  let userId: string | undefined

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

    // GET - Fetch weight history
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {}
      const startDate = params.startDate
      const endDate = params.endDate
      const limit = params.limit ? parseInt(params.limit) : 30 // Default last 30 entries

      let query = db
        .select()
        .from(weightHistory)
        .where(eq(weightHistory.userId, parseInt(userId)))
        .orderBy(desc(weightHistory.date))

      if (startDate && endDate) {
        query = query.where(
          and(
            eq(weightHistory.userId, parseInt(userId)),
            sql`${weightHistory.date} >= ${startDate}`,
            sql`${weightHistory.date} <= ${endDate}`
          )
        )
      }

      const entries = await query.limit(limit)

      return {
        statusCode: 200,
        body: JSON.stringify({ entries }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // POST - Add new weight entry
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { weight, date, notes, updateProfile } = body

      const [entry] = await db
        .insert(weightHistory)
        .values({
          userId: parseInt(userId),
          weight,
          date: date || new Date().toISOString().split('T')[0],
          notes: notes || null,
        })
        .returning()

      // If updateProfile is true, also update the user's profile weight
      if (updateProfile) {
        await db
          .update(userProfiles)
          .set({ weight, updatedAt: sql`now()` })
          .where(eq(userProfiles.userId, parseInt(userId)))
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ entry }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // DELETE - Remove weight entry
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
        .delete(weightHistory)
        .where(
          and(
            eq(weightHistory.id, parseInt(entryId)),
            eq(weightHistory.userId, parseInt(userId))
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
    console.error('Weight entries error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('User ID:', userId)
    console.error('HTTP Method:', event.httpMethod)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process weight entries',
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
