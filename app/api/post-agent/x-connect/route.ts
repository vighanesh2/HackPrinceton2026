import { NextRequest, NextResponse } from 'next/server'

/**
 * X OAuth Connect Flow
 * Step 1: Generate OAuth URL and redirect user to X
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session (you'll need to implement Supabase auth check)
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // X OAuth 2.0 Configuration
    const X_CLIENT_ID = process.env.X_CLIENT_ID
    const X_REDIRECT_URI = process.env.X_REDIRECT_URI || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/post-agent/x-callback` : undefined)
    const X_SCOPE = 'tweet.read tweet.write users.read offline.access'

    // Check for missing configuration
    if (!X_CLIENT_ID) {
      return NextResponse.json(
        { 
          error: 'X_CLIENT_ID not configured',
          details: 'Please add X_CLIENT_ID to your .env.local file'
        },
        { status: 500 }
      )
    }

    // Validate redirect URI is not a placeholder
    if (!X_REDIRECT_URI) {
      return NextResponse.json(
        { 
          error: 'X_REDIRECT_URI not configured',
          details: 'Please set either X_REDIRECT_URI or NEXT_PUBLIC_APP_URL in .env.local\n\nExample:\nX_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback\nNEXT_PUBLIC_APP_URL=http://localhost:3000'
        },
        { status: 500 }
      )
    }

    if (X_REDIRECT_URI.includes('your-domain.com')) {
      return NextResponse.json(
        { 
          error: 'X_REDIRECT_URI contains placeholder',
          details: 'Please replace "your-domain.com" with your actual domain in .env.local\n\nExample:\nX_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback'
        },
        { status: 500 }
      )
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    
    // Generate state for CSRF protection
    const state = generateRandomString(32)
    
    // Build OAuth URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', X_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', X_REDIRECT_URI)
    authUrl.searchParams.set('scope', X_SCOPE)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    // Store code_verifier and state in secure HTTP-only cookies
    // These will be used in the callback to complete OAuth
    const response = NextResponse.json({
      authUrl: authUrl.toString(),
    })

    // Set cookies with code_verifier and state
    // HttpOnly and SameSite for security
    response.cookies.set('x_oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes (OAuth flow should complete quickly)
      path: '/',
    })

    response.cookies.set('x_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('X OAuth connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate X connection' },
      { status: 500 }
    )
  }
}

function generateCodeVerifier(): string {
  return generateRandomString(128)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(digest))
}

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const values = crypto.getRandomValues(new Uint8Array(length))
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length]
  }
  return result
}

function base64URLEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

