import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

// Load environment variables from .env file
config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to users table...')

    // Add name column
    try {
      await sql.query(`
        ALTER TABLE users
        ADD COLUMN name text NOT NULL DEFAULT ''
      `)
      console.log('✓ Added name column')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('⚠ name column already exists')
      } else {
        throw error
      }
    }

    // Add updated_at column
    try {
      await sql.query(`
        ALTER TABLE users
        ADD COLUMN updated_at timestamp DEFAULT now() NOT NULL
      `)
      console.log('✓ Added updated_at column')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('⚠ updated_at column already exists')
      } else {
        throw error
      }
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

addMissingColumns()
