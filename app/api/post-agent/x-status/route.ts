import { NextRequest, NextResponse } from 'next/server'

/**
 * Check X connection status for current user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user from Supabase session
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Temporary: Check cookie for connection status (until Supabase is implemented)
    const username = request.cookies.get('x_connected_username')?.value
    
    if (username) {
      // User is connected (temporary cookie-based check)
      return NextResponse.json({
        connected: true,
        username: username,
        lastPost: undefined, // Will be available once Supabase is implemented
      })
    }

    // TODO: Query x_oauth_tokens table (when Supabase is implemented)
    // const { data: tokenData, error } = await supabase
    //   .from('x_oauth_tokens')
    //   .select('x_username, updated_at')
    //   .eq('user_id', user.id)
    //   .single()

    // TODO: Get last post from post_history
    // const { data: lastPost } = await supabase
    //   .from('post_history')
    //   .select('posted_at')
    //   .eq('user_id', user.id)
    //   .eq('status', 'success')
    //   .order('posted_at', { ascending: false })
    //   .limit(1)
    //   .single()

    // Not connected
    return NextResponse.json({
      connected: false,
      username: undefined,
      lastPost: undefined,
    })

    // Real implementation (when Supabase is ready):
    // return NextResponse.json({
    //   connected: !!tokenData,
    //   username: tokenData?.x_username,
    //   lastPost: lastPost?.posted_at,
    // })
  } catch (error: any) {
    console.error('X status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check X status' },
      { status: 500 }
    )
  }
}

