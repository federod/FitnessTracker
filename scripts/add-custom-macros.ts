import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function addCustomMacroColumns() {
  try {
    console.log('Adding custom macro columns to user_profiles table...')

    // Add custom macro columns
    try {
      await sql.query(`
        ALTER TABLE user_profiles
        ADD COLUMN IF NOT EXISTS custom_calories integer,
        ADD COLUMN IF NOT EXISTS custom_protein integer,
        ADD COLUMN IF NOT EXISTS custom_carbs integer,
        ADD COLUMN IF NOT EXISTS custom_fat integer,
        ADD COLUMN IF NOT EXISTS use_custom_macros integer DEFAULT 0
      `)
      console.log('✓ Added custom macro columns')
    } catch (error: any) {
      console.error('Error adding columns:', error.message)
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

addCustomMacroColumns()
