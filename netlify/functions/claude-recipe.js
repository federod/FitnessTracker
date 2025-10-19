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
    const { query } = JSON.parse(event.body)

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Recipe query is required' }),
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
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Find 10 recipes related to: "${query}"

IMPORTANT DIETARY GUIDELINES:
- If the query mentions "keto", "ketogenic", or "low carb": Focus on high-fat, very low-carb recipes (under 10g net carbs per serving)
- If the query mentions "carnivore": ONLY animal products - meat, fish, eggs, dairy. NO plants, vegetables, or fruits
- If the query mentions "paleo": No grains, legumes, or dairy. Focus on meat, fish, vegetables, fruits, nuts
- If the query mentions "vegan": NO animal products at all
- If the query mentions "vegetarian": No meat or fish, but dairy and eggs allowed
- If the query mentions "high protein": Each recipe should have 30g+ protein per serving
- If the query mentions "healthy" or "clean": Whole foods, minimal processing, no added sugars

Provide a JSON array of exactly 10 recipes with the following structure:
[
  {
    "title": "recipe name",
    "servings": "serves X",
    "ingredients": "ingredient 1 | ingredient 2 | ingredient 3",
    "instructions": "step-by-step cooking instructions"
  }
]

Make the recipes practical, realistic, and STRICTLY follow any dietary restrictions mentioned.
Separate ingredients with | character.
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

    const recipesText = data.content[0].text
    console.log('Recipes text from Claude:', recipesText)

    // Parse the JSON response from Claude
    const recipes = JSON.parse(recipesText)
    console.log('Parsed recipes count:', recipes.length)

    return {
      statusCode: 200,
      body: JSON.stringify({ recipes }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Recipe search error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to search recipes',
        details: error.message || String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
