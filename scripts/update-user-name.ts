import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function updateUserName() {
  try {
    // Get the email you want to update
    const email = process.argv[2]
    const name = process.argv[3]

    if (!email || !name) {
      console.error('Usage: tsx scripts/update-user-name.ts <email> <name>')
      console.error('Example: tsx scripts/update-user-name.ts user@example.com "John Doe"')
      process.exit(1)
    }

    console.log(`Updating name for user: ${email}`)

    const result = await sql`
      UPDATE users
      SET name = ${name}, updated_at = NOW()
      WHERE email = ${email.toLowerCase()}
      RETURNING id, email, name
    `

    if (result.length === 0) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log('✅ User updated successfully:')
    console.log(result[0])
  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }
}

updateUserName()
