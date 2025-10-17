import type { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
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

export const handler: Handler = async (event) => {
  // Only allow POST requests
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

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  try {
    const { email, password, name } = JSON.parse(event.body || '{}')

    // Validate input
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email, password, and name are required' }),
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email format' }),
      }
    }

    // Validate password length
    if (password.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 6 characters' }),
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

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
    const existingUser = existingUsers[0]

    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'User already exists' }),
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'JWT configuration error' }),
      }
    }

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      jwtSecret,
      { expiresIn: '7d' }
    )

    return {
      statusCode: 201,
      body: JSON.stringify({
        user: newUser,
        token,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }
}
