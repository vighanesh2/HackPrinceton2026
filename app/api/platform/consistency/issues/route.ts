import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** List consistency issues for the signed-in user. */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'open'

    let q = supabase
      .from('consistency_issues')
      .select('id, severity, issue_type, summary, source_doc_id, target_doc_id, details, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(80)

    if (status !== 'all') {
      q = q.eq('status', status)
    }

    const { data, error } = await q

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ issues: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'issues list failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
