export const handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
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
    const { muscle, difficulty } = JSON.parse(event.body)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Anthropic API key not configured' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    // Build the query
    let query = 'Suggest 10 exercises'
    if (muscle) query += ` for ${muscle}`
    if (difficulty) query += ` at ${difficulty} level`

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `${query}

Provide a JSON array of exactly 10 exercises with the following structure:
[
  {
    "name": "exercise name",
    "type": "cardio|strength|flexibility|sports",
    "difficulty": "beginner|intermediate|expert",
    "muscle": "primary muscle group",
    "instructions": "brief description of how to perform"
  }
]

Only respond with valid JSON array, no other text.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Claude API response:', JSON.stringify(data))

    const exercisesText = data.content[0].text
    console.log('Exercises text from Claude:', exercisesText)

    // Parse the JSON response from Claude
    const exercises = JSON.parse(exercisesText)
    console.log('Parsed exercises count:', exercises.length)

    return {
      statusCode: 200,
      body: JSON.stringify({ exercises }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Exercise suggestion error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to suggest exercises',
        details: error.message || String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
