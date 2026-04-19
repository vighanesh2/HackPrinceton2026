import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  runMetricConsistencyScanForUser,
  runNarrativeConsistencyScanForUser,
} from '@/lib/platform/workspaceAnalyze'

/**
 * Scan all of the user’s numeric claims and (re)open metric consistency issues.
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

    try {
      const { issueCount: metricIssues } = await runMetricConsistencyScanForUser(supabase, user.id)
      const { issueCount: narrativeIssues } = await runNarrativeConsistencyScanForUser(supabase, user.id)
      return NextResponse.json({ ok: true, issueCount: metricIssues + narrativeIssues, metricIssues, narrativeIssues })
    } catch (inner) {
      const msg = inner instanceof Error ? inner.message : 'consistency run failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'consistency run failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
