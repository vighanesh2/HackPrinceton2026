import { NextRequest, NextResponse } from 'next/server'

/**
 * Disconnect X account (delete tokens)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get authenticated user from Supabase session
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // TODO: Delete tokens and deactivate schedule
    // await supabase
    //   .from('x_oauth_tokens')
    //   .delete()
    //   .eq('user_id', user.id)

    // await supabase
    //   .from('posting_schedule')
    //   .update({ is_active: false })
    //   .eq('user_id', user.id)

    // Temporary: Clear connection cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('x_connected_username')
    
    return response
  } catch (error: any) {
    console.error('X disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect X account' },
      { status: 500 }
    )
  }
}

