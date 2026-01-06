import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, mode, existingHtml } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use selected model or default to gemini-2.5-pro
    const selectedModel = model || 'gemini-2.5-pro'
    const fallbackModel = selectedModel === 'gemini-2.5-pro' ? 'gemini-2.0-flash' : 'gemini-2.5-pro'
    const isRefinement = mode === 'refinement' && existingHtml

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Create a detailed prompt for HTML generation
    let systemPrompt: string
    
    if (isRefinement) {
      systemPrompt = `You are an expert web developer. Modify the existing HTML code based on the user's refinement request.

Current HTML code:
\`\`\`html
${existingHtml}
\`\`\`

User's refinement request: ${prompt}

Requirements:
- Generate ONLY valid HTML code (no markdown, no explanations)
- Keep the existing structure and only modify what the user requested
- Maintain all CSS styles inline in a <style> tag in the <head>
- Preserve the overall design unless specifically asked to change it
- Make only the requested changes, don't add unnecessary modifications
- Ensure the HTML is complete and can be rendered directly in a browser

Generate the updated HTML code now:`
    } else {
      systemPrompt = `You are an expert web developer. Generate a complete, production-ready HTML page based on the user's description. 

Requirements:
- Generate ONLY valid HTML code (no markdown, no explanations)
- Include complete HTML structure with <!DOCTYPE html>, <head>, and <body>
- Include all CSS styles inline in a <style> tag in the <head>
- Make it responsive and modern
- Use clean, semantic HTML
- Include proper viewport meta tag
- Make it visually appealing with modern design principles
- Use colors that are professional and modern
- Ensure the HTML is complete and can be rendered directly in a browser

User's request: ${prompt}

Generate the complete HTML code now:`
    }

    // Helper function to make API call
    const makeApiCall = async (modelName: string) => {
      // Ensure model name is correct format
      const model = modelName === 'gemini-2.5-pro' ? 'gemini-2.5-pro' : 
                    modelName === 'gemini-2.0-flash' ? 'gemini-2.0-flash' : 
                    'gemini-2.5-pro'
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message || `API request failed with status ${response.status}`
        )
      }

      const data = await response.json()
      
      // Extract the generated text from the response
      const html = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!html) {
        throw new Error('No content generated from API')
      }

      return html
    }

    // Try selected model first, fallback to the other model
    let html: string
    console.log(`Attempting to use model: ${selectedModel}`)
    try {
      html = await makeApiCall(selectedModel)
      console.log(`Successfully generated HTML using ${selectedModel}`)
    } catch (error: any) {
      console.log(`${selectedModel} failed, trying ${fallbackModel}:`, error.message)
      try {
        html = await makeApiCall(fallbackModel)
        console.log(`Successfully generated HTML using fallback model: ${fallbackModel}`)
      } catch (fallbackError: any) {
        throw new Error(
          `Both models failed. ${selectedModel} error: ${error.message}. ${fallbackModel} error: ${fallbackError.message}`
        )
      }
    }

    // Clean up the response (remove markdown code blocks if present)
    let cleanHtml = html.trim()
    if (cleanHtml.startsWith('```html')) {
      cleanHtml = cleanHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '')
    } else if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    return NextResponse.json({ html: cleanHtml.trim() })
  } catch (error: any) {
    console.error('Error generating prototype:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate prototype' },
      { status: 500 }
    )
  }
}

