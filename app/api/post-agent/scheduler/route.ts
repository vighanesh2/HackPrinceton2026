import { NextRequest, NextResponse } from 'next/server'

/**
 * Daily Scheduler Endpoint
 * 
 * This endpoint should be called by:
 * - Supabase Edge Function (cron)
 * - External cron service (cron-job.org, GitHub Actions, etc.)
 * - Vercel Cron Jobs
 * 
 * DO NOT use n8n Cron for scheduling.
 * 
 * Schedule: Run daily at 9:00 AM UTC (or your preferred time)
 */
export async function POST(request: NextRequest) {
  // Verify scheduler secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const schedulerSecret = process.env.SCHEDULER_SECRET

  if (!schedulerSecret || authHeader !== `Bearer ${schedulerSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // TODO: Connect to Supabase
    // const supabase = createClient(...)

    // Get users scheduled for posting today
    // This uses the database function that bypasses RLS
    // const { data: users, error } = await supabase.rpc('get_users_scheduled_today')

    // Mock implementation
    const users: any[] = [] // TODO: Replace with actual query

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { 
          error: 'N8N webhook not configured',
          details: 'Please set N8N_WEBHOOK_URL in your .env.local file'
        },
        { status: 500 }
      )
    }

    // Check if URL is a placeholder
    if (N8N_WEBHOOK_URL.includes('your-n8n-instance.com') || 
        (N8N_WEBHOOK_URL.includes('localhost:5678') === false && 
         !N8N_WEBHOOK_URL.startsWith('http'))) {
      return NextResponse.json(
        { 
          error: 'Invalid N8N webhook URL',
          details: `N8N_WEBHOOK_URL appears to be a placeholder: "${N8N_WEBHOOK_URL}". Please set it to your actual n8n webhook URL.`
        },
        { status: 500 }
      )
    }

    // Trigger n8n workflow for each user
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.user_id,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to trigger for user ${user.user_id}`)
        }

        return { user_id: user.user_id, status: 'triggered' }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      processed: users.length,
      successful,
      failed,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Scheduler error:', error)
    return NextResponse.json(
      { error: 'Scheduler failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'post-agent-scheduler',
    timestamp: new Date().toISOString(),
  })
}

