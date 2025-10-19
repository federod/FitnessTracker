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
    const { foodQuery } = JSON.parse(event.body)

    if (!foodQuery) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Food query is required' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

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
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze the nutritional content of: "${foodQuery}"

Provide a JSON response with the following structure (use reasonable estimates for a typical serving):
{
  "name": "food name",
  "serving_size": "amount (e.g., 100g, 1 cup, 1 medium)",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams)
}

Only respond with valid JSON, no other text.`
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

    const nutritionText = data.content[0].text
    console.log('Nutrition text from Claude:', nutritionText)

    // Parse the JSON response from Claude
    const nutritionData = JSON.parse(nutritionText)
    console.log('Parsed nutrition data:', JSON.stringify(nutritionData))

    return {
      statusCode: 200,
      body: JSON.stringify({ nutrition: nutritionData }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Nutrition lookup error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to analyze nutrition',
        details: error.message || String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
