import { neon } from '@neondatabase/serverless'

async function checkSchema() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  try {
    // Check weight_history table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'weight_history'
      ORDER BY ordinal_position
    `

    console.log('Weight history table columns:')
    console.table(columns)

    // Try a test query
    console.log('\n Testing query...')
    const testQuery = await sql`
      SELECT * FROM weight_history LIMIT 1
    `
    console.log('✅ Query works')
    console.log('Sample row:', testQuery[0] || 'No rows yet')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  }
}

checkSchema()
