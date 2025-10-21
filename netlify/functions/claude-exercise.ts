import { Handler } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

export const handler: Handler = async (event) => {
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
    const { exerciseName } = JSON.parse(event.body || '{}')

    if (!exerciseName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Exercise name is required' }),
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
        body: JSON.stringify({ error: 'API key not configured' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    }

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a fitness expert. Given an exercise name, provide the following information:
1. Exercise type (must be exactly one of: cardio, strength, flexibility, sports)
2. Estimated calories burned per minute for an average adult

Exercise: "${exerciseName}"

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "type": "cardio",
  "caloriesPerMinute": 8.5
}

Guidelines:
- cardio: running, cycling, swimming, rowing, jump rope, etc.
- strength: weightlifting, bodyweight exercises, resistance training
- flexibility: yoga, stretching, pilates
- sports: basketball, soccer, tennis, etc.
- Calories per minute should be realistic (typically 3-15 for most exercises)
- For strength training, use 5-8 calories per minute
- For cardio, use 8-12 calories per minute
- For flexibility, use 3-5 calories per minute
- For sports, use 7-12 calories per minute depending on intensity`
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const exerciseData = JSON.parse(responseText)

    // Validate the response
    const validTypes = ['cardio', 'strength', 'flexibility', 'sports']
    if (!validTypes.includes(exerciseData.type)) {
      exerciseData.type = 'cardio' // Default fallback
    }

    if (typeof exerciseData.caloriesPerMinute !== 'number' || exerciseData.caloriesPerMinute <= 0) {
      exerciseData.caloriesPerMinute = 7 // Default fallback
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        exercise: {
          name: exerciseName,
          type: exerciseData.type,
          caloriesPerMinute: exerciseData.caloriesPerMinute
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (error) {
    console.error('Claude exercise lookup error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to lookup exercise information',
        details: error instanceof Error ? error.message : String(error),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  }
}
