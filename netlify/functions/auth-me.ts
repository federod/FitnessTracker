import type { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

// Define users table inline
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

interface JWTPayload {
  userId: number
  email: string
}

export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Get token from Authorization header
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No token provided' }),
      }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'JWT configuration error' }),
      }
    }

    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      }
    }

    // Get database connection
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database configuration error' }),
      }
    }

    const sql = neon(databaseUrl)
    const db = drizzle(sql)

    // Get user from database
    const userResults = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1)
    const user = userResults[0]

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      }
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return {
      statusCode: 200,
      body: JSON.stringify({ user: userWithoutPassword }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  } catch (error) {
    console.error('Auth me error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
