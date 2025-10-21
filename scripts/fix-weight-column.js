import { neon } from '@neondatabase/serverless'

async function fixWeightColumn() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  console.log('🔗 Connecting to Neon database...')
  const sql = neon(databaseUrl)

  try {
    console.log('\n📝 Fixing weight column type...')

    // Alter the weight column from integer to real (decimal)
    await sql`
      ALTER TABLE weight_history
      ALTER COLUMN weight TYPE real
    `

    console.log('✅ Weight column type changed from integer to real')

    // Also fix user_id to be NOT NULL
    await sql`
      ALTER TABLE weight_history
      ALTER COLUMN user_id SET NOT NULL
    `

    console.log('✅ user_id column set to NOT NULL')

    // Verify the changes
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'weight_history'
      ORDER BY ordinal_position
    `

    console.log('\n✅ Updated weight_history table columns:')
    console.table(columns)

    console.log('\n🎉 Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

fixWeightColumn()
