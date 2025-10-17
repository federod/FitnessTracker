import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env file
config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = join(process.cwd(), 'drizzle', '0000_motionless_giant_man.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Split by statement breakpoint and clean up
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      try {
        // Use neon's query method for raw SQL
        await sql.query(statement)
        console.log(`✓ Statement ${i + 1} executed successfully`)
      } catch (error: any) {
        // Check if error is about existing object, which is okay
        if (error.message?.includes('already exists')) {
          console.log(`⚠ Statement ${i + 1} skipped (object already exists)`)
        } else {
          throw error
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
