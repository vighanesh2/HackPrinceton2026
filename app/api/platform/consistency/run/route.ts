import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Legacy hook for OpenClaw / tools. Server-side cross-doc scans were removed until the
 * detector is replaced; the app computes issues client-side (`computeWorkspaceCrossDocIssues`).
 */
export async function POST() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      issueCount: 0,
      metricIssues: 0,
      narrativeIssues: 0,
      message: 'Server consistency scan disabled; cross-doc engine runs in the workspace client.',
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'consistency run failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
