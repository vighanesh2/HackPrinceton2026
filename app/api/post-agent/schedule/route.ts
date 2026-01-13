import { NextRequest, NextResponse } from 'next/server'

/**
 * Get and update posting schedule
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user from Supabase session
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // TODO: Query posting_schedule table
    // const { data: schedule, error } = await supabase
    //   .from('posting_schedule')
    //   .select('post_time, timezone, is_active')
    //   .eq('user_id', user.id)
    //   .single()

    // Temporary: Check cookie for connection (until Supabase is implemented)
    const username = request.cookies.get('x_connected_username')?.value
    
    if (!username) {
      return NextResponse.json({
        postTime: '09:00:00',
        timezone: 'UTC',
        isActive: false,
      })
    }

    // Check cookie for stored time preference
    const storedTime = request.cookies.get('x_post_time')?.value || '09:00'
    const storedTimezone = request.cookies.get('x_post_timezone')?.value || 'UTC'
    
    // Convert HH:mm to HH:mm:ss for response
    const postTimeWithSeconds = storedTime.includes(':') && storedTime.split(':').length === 2 
      ? `${storedTime}:00` 
      : storedTime

    return NextResponse.json({
      postTime: postTimeWithSeconds,
      timezone: storedTimezone,
      isActive: true,
    })

    // Real implementation:
    // return NextResponse.json({
    //   postTime: schedule?.post_time || '09:00:00',
    //   timezone: schedule?.timezone || 'UTC',
    //   isActive: schedule?.is_active ?? false,
    // })
  } catch (error: any) {
    console.error('Get schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to load schedule' },
      { status: 500 }
    )
  }
}

/**
 * Update posting schedule
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get authenticated user from Supabase session
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { postTime, timezone } = body

    if (!postTime) {
      return NextResponse.json(
        { error: 'Post time is required' },
        { status: 400 }
      )
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(postTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm (e.g., 09:00)' },
        { status: 400 }
      )
    }

    // Convert HH:mm to HH:mm:ss for database
    const postTimeWithSeconds = `${postTime}:00`

    // TODO: Update posting_schedule table
    // const { error } = await supabase
    //   .from('posting_schedule')
    //   .upsert({
    //     user_id: user.id,
    //     post_time: postTimeWithSeconds,
    //     timezone: timezone || 'UTC',
    //     is_active: true,
    //     next_post_at: calculateNextPostTime(postTimeWithSeconds, timezone),
    //   })

    // Temporary: Store in cookie (until Supabase is implemented)
    const username = request.cookies.get('x_connected_username')?.value
    if (!username) {
      return NextResponse.json(
        { error: 'X account not connected' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      postTime: postTimeWithSeconds,
      timezone: timezone || 'UTC',
    })

    // Store in cookie temporarily
    response.cookies.set('x_post_time', postTime, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    if (timezone) {
      response.cookies.set('x_post_timezone', timezone, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
    }

    return response

    // Real implementation:
    // return NextResponse.json({
    //   success: true,
    //   postTime: postTimeWithSeconds,
    //   timezone: timezone || 'UTC',
    // })
  } catch (error: any) {
    console.error('Update schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

