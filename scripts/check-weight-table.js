import { neon } from '@neondatabase/serverless'

async function checkWeightTable() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  console.log('🔗 Checking weight_history table structure...\n')
  const sql = neon(databaseUrl)

  try {
    // Get table columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'weight_history'
      ORDER BY ordinal_position
    `

    console.log('📋 Columns in weight_history table:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

checkWeightTable()
