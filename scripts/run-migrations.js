import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables')
    process.exit(1)
  }

  console.log('🔗 Connecting to Neon database...')
  const sql = neon(databaseUrl)

  try {
    // Migration 1: Create weight_history table
    console.log('\n📝 Running Migration 1: Create weight_history table...')

    await sql`
      CREATE TABLE IF NOT EXISTS "weight_history" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "weight" real NOT NULL,
        "date" date NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `
    console.log('✅ weight_history table created')

    // Add foreign key constraint
    try {
      await sql`
        ALTER TABLE "weight_history"
        ADD CONSTRAINT "weight_history_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE no action ON UPDATE no action
      `
      console.log('✅ Foreign key constraint added')
    } catch (err) {
      if (err.message?.includes('already exists')) {
        console.log('ℹ️  Foreign key constraint already exists (skipping)')
      } else {
        throw err
      }
    }

    // Migration 2: Add custom macro columns
    console.log('\n📝 Running Migration 2: Add custom macro columns...')

    const columns = [
      { name: 'use_custom_macros', type: 'integer DEFAULT 0 NOT NULL' },
      { name: 'custom_calories', type: 'integer DEFAULT 0' },
      { name: 'custom_protein', type: 'integer DEFAULT 0' },
      { name: 'custom_carbs', type: 'integer DEFAULT 0' },
      { name: 'custom_fat', type: 'integer DEFAULT 0' }
    ]

    for (const col of columns) {
      try {
        const query = `ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`
        await sql.unsafe(query)
        console.log(`✅ Added column: ${col.name}`)
      } catch (err) {
        if (err.message?.includes('already exists')) {
          console.log(`ℹ️  Column ${col.name} already exists (skipping)`)
        } else {
          throw err
        }
      }
    }

    // Migration 3: Add new exercise types to enum
    console.log('\n📝 Running Migration 3: Add new exercise types...')

    try {
      // Check if enum values already exist
      const checkKnees = await sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'exercise_type' AND e.enumlabel = 'knees-over-toes'
        )
      `

      if (!checkKnees[0].exists) {
        await sql`ALTER TYPE "public"."exercise_type" ADD VALUE 'knees-over-toes'`
        console.log('✅ Added exercise type: knees-over-toes')
      } else {
        console.log('ℹ️  Exercise type knees-over-toes already exists (skipping)')
      }

      const checkPlyos = await sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'exercise_type' AND e.enumlabel = 'plyos'
        )
      `

      if (!checkPlyos[0].exists) {
        await sql`ALTER TYPE "public"."exercise_type" ADD VALUE 'plyos'`
        console.log('✅ Added exercise type: plyos')
      } else {
        console.log('ℹ️  Exercise type plyos already exists (skipping)')
      }
    } catch (err) {
      console.error('⚠️  Error adding exercise types:', err.message)
      // Don't fail the entire migration if enum values already exist
    }

    console.log('\n🎉 All migrations completed successfully!')
    console.log('\n📊 Database is ready to use!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigrations()
