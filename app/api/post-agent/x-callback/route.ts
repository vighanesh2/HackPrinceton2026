import { NextRequest, NextResponse } from 'next/server'

/**
 * X OAuth Callback
 * Step 2: Exchange authorization code for tokens
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/post-agent?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/post-agent?error=missing_params', request.url)
    )
  }

  try {
    const X_CLIENT_ID = process.env.X_CLIENT_ID
    const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET
    const X_REDIRECT_URI = process.env.X_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/post-agent/x-callback`

    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/post-agent?error=config_missing', request.url)
      )
    }

    // Retrieve code_verifier and state from cookies
    const codeVerifier = request.cookies.get('x_oauth_code_verifier')?.value
    const storedState = request.cookies.get('x_oauth_state')?.value

    if (!codeVerifier) {
      console.error('Missing code_verifier in cookies')
      return NextResponse.redirect(
        new URL('/post-agent?error=missing_code_verifier', request.url)
      )
    }

    // Verify state matches (CSRF protection)
    if (!storedState || storedState !== state) {
      console.error('State mismatch - possible CSRF attack')
      return NextResponse.redirect(
        new URL('/post-agent?error=state_mismatch', request.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: X_CLIENT_ID,
        redirect_uri: X_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      
      // Clear cookies on error
      const errorResponse = NextResponse.redirect(
        new URL(`/post-agent?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(errorData))}`, request.url)
      )
      errorResponse.cookies.delete('x_oauth_code_verifier')
      errorResponse.cookies.delete('x_oauth_state')
      
      return errorResponse
    }

    const tokens = await tokenResponse.json()

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=username', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL('/post-agent?error=user_fetch_failed', request.url)
      )
    }

    const userData = await userResponse.json()
    const xUserId = userData.data.id
    const xUsername = userData.data.username

    // TODO: Get authenticated user from Supabase session
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.redirect(new URL('/post-agent?error=unauthorized', request.url))

    // Encrypt tokens before storing
    // In production, use Supabase Vault or pgcrypto
    const encryptedAccessToken = await encryptToken(tokens.access_token)
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encryptToken(tokens.refresh_token) 
      : null

    // Calculate token expiry
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 7200))

    // TODO: Store tokens in Supabase x_oauth_tokens table
    // await supabase
    //   .from('x_oauth_tokens')
    //   .upsert({
    //     user_id: user.id,
    //     x_user_id: xUserId,
    //     x_username: xUsername,
    //     access_token_encrypted: encryptedAccessToken,
    //     refresh_token_encrypted: encryptedRefreshToken,
    //     token_expires_at: expiresAt.toISOString(),
    //     scope: tokens.scope,
    //   })

    // TODO: Create or update posting_schedule
    // await supabase
    //   .from('posting_schedule')
    //   .upsert({
    //     user_id: user.id,
    //     is_active: true,
    //     next_post_at: calculateNextPostTime(),
    //   })

    // Store username temporarily in cookie (until Supabase is implemented)
    // This allows the UI to show connection status immediately
    const redirectResponse = NextResponse.redirect(
      new URL(`/post-agent?connected=true&username=${encodeURIComponent(xUsername)}`, request.url)
    )
    
    // Clear OAuth cookies
    redirectResponse.cookies.delete('x_oauth_code_verifier')
    redirectResponse.cookies.delete('x_oauth_state')
    
    // Store connection info temporarily (until Supabase integration)
    redirectResponse.cookies.set('x_connected_username', xUsername, {
      httpOnly: false, // Allow client-side access for now
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    
    return redirectResponse
  } catch (error: any) {
    console.error('X OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/post-agent?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}

async function encryptToken(token: string): Promise<string> {
  // TODO: Implement encryption using Supabase Vault or pgcrypto
  // For MVP, you can use a simple encryption or store in Supabase Vault
  // Example with pgcrypto (requires database function):
  // SELECT pgp_sym_encrypt($1, current_setting('app.encryption_key'))
  
  // For now, return base64 encoded (NOT secure - implement proper encryption)
  return Buffer.from(token).toString('base64')
}

