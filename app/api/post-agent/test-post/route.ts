import { NextRequest, NextResponse } from 'next/server'

/**
 * Test post endpoint - manually trigger a post
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get authenticated user from Supabase session
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // TODO: Trigger n8n webhook with user_id
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
    
    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { 
          error: 'N8N webhook not configured',
          details: 'Please set N8N_WEBHOOK_URL in your .env.local file. See docs/QUICK_SETUP_GUIDE.md for instructions.'
        },
        { status: 500 }
      )
    }

    // Check if URL is a placeholder
    if (N8N_WEBHOOK_URL.includes('your-n8n-instance.com') || 
        N8N_WEBHOOK_URL.includes('localhost:5678') === false && 
        !N8N_WEBHOOK_URL.startsWith('http')) {
      return NextResponse.json(
        { 
          error: 'Invalid N8N webhook URL',
          details: `N8N_WEBHOOK_URL appears to be a placeholder: "${N8N_WEBHOOK_URL}". Please set it to your actual n8n webhook URL. See docs/QUICK_SETUP_GUIDE.md`
        },
        { status: 500 }
      )
    }

    // Trigger n8n workflow
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'user-id-here', // TODO: Use actual user.id
        test_mode: true,
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { 
          error: 'Failed to trigger post',
          details: `n8n returned status ${response.status}: ${errorText}`
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Test post error:', error)
    
    // Provide helpful error messages
    let errorMessage = 'Failed to create test post'
    let errorDetails = error.message || 'Unknown error'
    
    if (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = 'Connection timeout'
      errorDetails = 'Could not reach n8n webhook. Please check:\n1. n8n is running\n2. N8N_WEBHOOK_URL is correct\n3. n8n webhook is activated'
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to n8n'
      errorDetails = `Cannot reach ${process.env.N8N_WEBHOOK_URL}. Make sure n8n is running and the webhook URL is correct.`
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

