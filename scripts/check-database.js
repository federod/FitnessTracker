import { neon } from '@neondatabase/serverless'

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables')
    process.exit(1)
  }

  console.log('🔗 Connecting to Neon database...')
  console.log('📍 Database host:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown')
  console.log('')

  const sql = neon(databaseUrl)

  try {
    // Check tables exist
    console.log('📊 Checking database tables...\n')

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log('✅ Tables found:')
    tables.forEach(t => console.log(`   - ${t.table_name}`))
    console.log('')

    // Check exercise_type enum values
    console.log('🏃 Exercise types in database:')
    const exerciseTypes = await sql`
      SELECT e.enumlabel as type
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'exercise_type'
      ORDER BY e.enumlabel
    `

    exerciseTypes.forEach(t => console.log(`   - ${t.type}`))
    console.log('')

    // Check users
    console.log('👥 Users in database:')
    const users = await sql`SELECT id, email, name, created_at FROM users ORDER BY created_at DESC`
    console.log(`   Total: ${users.length} users`)
    users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id}) - Created: ${u.created_at}`))
    console.log('')

    // Check user profiles
    console.log('📋 User profiles:')
    const profiles = await sql`
      SELECT
        up.user_id,
        up.age,
        up.weight,
        up.height,
        up.goal,
        up.use_custom_macros,
        u.email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
    `
    console.log(`   Total: ${profiles.length} profiles`)
    profiles.forEach(p => console.log(`   - User ${p.email}: ${p.weight}kg, ${p.height}cm, Goal: ${p.goal}`))
    console.log('')

    // Check food entries
    console.log('🍽️  Food entries:')
    const foodEntries = await sql`
      SELECT date, COUNT(*) as count
      FROM food_entries
      GROUP BY date
      ORDER BY date DESC
      LIMIT 10
    `
    console.log(`   Recent entries by date:`)
    foodEntries.forEach(e => console.log(`   - ${e.date}: ${e.count} entries`))
    console.log('')

    // Check exercise entries
    console.log('💪 Exercise entries:')
    const exercises = await sql`
      SELECT date, type, COUNT(*) as count
      FROM exercises
      GROUP BY date, type
      ORDER BY date DESC
      LIMIT 10
    `
    console.log(`   Recent exercises:`)
    exercises.forEach(e => console.log(`   - ${e.date} (${e.type}): ${e.count} entries`))
    console.log('')

    // Check weight history
    console.log('⚖️  Weight history:')
    const weights = await sql`
      SELECT w.date, w.weight, u.email
      FROM weight_history w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.date DESC
      LIMIT 10
    `
    console.log(`   Total: ${weights.length} entries`)
    weights.forEach(w => console.log(`   - ${w.date}: ${w.weight}kg (${w.email})`))
    console.log('')

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 DATABASE SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const totalFoodEntries = await sql`SELECT COUNT(*) as count FROM food_entries`
    const totalExercises = await sql`SELECT COUNT(*) as count FROM exercises`
    const totalWeights = await sql`SELECT COUNT(*) as count FROM weight_history`

    console.log(`✅ Users: ${users.length}`)
    console.log(`✅ User Profiles: ${profiles.length}`)
    console.log(`✅ Food Entries: ${totalFoodEntries[0].count}`)
    console.log(`✅ Exercise Entries: ${totalExercises[0].count}`)
    console.log(`✅ Weight History: ${totalWeights[0].count}`)
    console.log(`✅ Exercise Types: ${exerciseTypes.length}`)
    console.log('')
    console.log('🎉 Database check complete!')

  } catch (error) {
    console.error('\n❌ Database check failed:', error.message)
    console.error('Error details:', error)
    process.exit(1)
  }
}

checkDatabase()
