import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

export const handler = async (event) => {
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

  try {
    // Get token from Authorization header
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No token provided' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'JWT configuration error' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // Get database connection
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database configuration error' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    const sql = neon(databaseUrl)

    // Get user profile
    const profiles = await sql`
      SELECT * FROM user_profiles
      WHERE user_id = ${decoded.userId}
      LIMIT 1
    `

    if (profiles.length === 0) {
      // No profile yet, return null
      return {
        statusCode: 200,
        body: JSON.stringify({ profile: null }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ profile: profiles[0] }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Profile get error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || String(error)
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
