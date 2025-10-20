import { neon } from '@neondatabase/serverless'

async function addNotesColumn() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  console.log('🔗 Adding notes column to weight_history table...\n')
  const sql = neon(databaseUrl)

  try {
    // Add notes column
    await sql`
      ALTER TABLE weight_history
      ADD COLUMN IF NOT EXISTS notes text
    `

    console.log('✅ Added notes column to weight_history table')

    // Verify
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'weight_history'
      ORDER BY ordinal_position
    `

    console.log('\n📋 Updated columns:')
    columns.forEach(col => console.log(`   - ${col.column_name}`))
    console.log('\n🎉 Migration complete!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

addNotesColumn()
