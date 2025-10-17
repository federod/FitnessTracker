export const handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }

  try {
    const name = event.queryStringParameters?.name
    const type = event.queryStringParameters?.type
    const muscle = event.queryStringParameters?.muscle
    const difficulty = event.queryStringParameters?.difficulty

    const apiKey = process.env.NINJA_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // Build query parameters
    const params = new URLSearchParams()
    if (name) params.append('name', name)
    if (type) params.append('type', type)
    if (muscle) params.append('muscle', muscle)
    if (difficulty) params.append('difficulty', difficulty)

    // Call Ninja API Exercises endpoint
    const url = `https://api.api-ninjas.com/v1/exercises${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Ninja API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      statusCode: 200,
      body: JSON.stringify({ exercises: data }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Exercise search error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to search exercises',
        details: error.message || String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
