import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  // Simple health check endpoint
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    }
  }

  try {
    const DATABASE_URL = process.env.DATABASE_URL

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          hasDatabaseUrl: !!DATABASE_URL,
          databaseHost: DATABASE_URL?.split('@')[1]?.split('/')[0] || 'not found',
          nodeVersion: process.version,
        }
      }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Health check failed',
        details: error instanceof Error ? error.message : String(error),
      }),
    }
  }
}
