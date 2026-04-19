import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Paper trail rows from `document_edits` (Decision Log). */
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
    const docId = searchParams.get('docId')?.trim()

    let q = supabase
      .from('document_edits')
      .select(
        'id, doc_id, author_display, source, action, diff_stats, created_at, text_before, text_after'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (docId) {
      q = q.eq('doc_id', docId)
    }

    const { data, error } = await q

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ edits: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'decision-log failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
