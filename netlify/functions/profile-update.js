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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
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

    const { age, gender, height, weight, activityLevel, goal, targetWeight } = JSON.parse(event.body || '{}')

    // Validate required fields
    if (!age || !gender || !height || !weight || !activityLevel || !goal) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
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

    // Upsert user profile (insert or update)
    const profiles = await sql`
      INSERT INTO user_profiles (user_id, age, gender, height, weight, activity_level, goal, target_weight, updated_at)
      VALUES (${decoded.userId}, ${age}, ${gender}, ${height}, ${weight}, ${activityLevel}, ${goal}, ${targetWeight || null}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        age = ${age},
        gender = ${gender},
        height = ${height},
        weight = ${weight},
        activity_level = ${activityLevel},
        goal = ${goal},
        target_weight = ${targetWeight || null},
        updated_at = NOW()
      RETURNING *
    `

    return {
      statusCode: 200,
      body: JSON.stringify({ profile: profiles[0] }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || String(error),
        stack: error.stack
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
