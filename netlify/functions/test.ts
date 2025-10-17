import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Function is working!',
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  }
}
