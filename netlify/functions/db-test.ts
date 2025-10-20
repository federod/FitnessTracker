import { Handler } from '@netlify/functions'
import { getDb, users } from '../../src/db'

export const handler: Handler = async (event) => {
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

  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'DATABASE_URL not configured' }),
    }
  }

  try {
    console.log('Testing database connection...')
    const db = getDb(DATABASE_URL)

    console.log('Querying users table...')
    const userCount = await db.select().from(users).limit(1)

    console.log('Query successful!')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'Database connection successful',
        userCount: userCount.length,
        timestamp: new Date().toISOString(),
      }),
    }
  } catch (error) {
    console.error('Database test error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Database test failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    }
  }
}
