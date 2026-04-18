import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SUMMARY_HTML = 500_000
const MAX_DECK_TEXT = 24_000

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_one_pagers')
    .select('view_title, summary_html, deck_filename, deck_text, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ record: null })
  }

  return NextResponse.json({ record: data })
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Expected object body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const viewTitle = typeof b.viewTitle === 'string' ? b.viewTitle.slice(0, 500) : ''
  let summaryHtml = typeof b.summaryHtml === 'string' ? b.summaryHtml : ''
  if (summaryHtml.length > MAX_SUMMARY_HTML) {
    summaryHtml = summaryHtml.slice(0, MAX_SUMMARY_HTML)
  }
  const deckFilename =
    b.deckFilename === null || b.deckFilename === undefined
      ? null
      : typeof b.deckFilename === 'string'
        ? b.deckFilename.slice(0, 500)
        : null
  let deckText = typeof b.deckText === 'string' ? b.deckText : ''
  if (deckText.length > MAX_DECK_TEXT) {
    deckText = deckText.slice(0, MAX_DECK_TEXT)
  }

  const { error } = await supabase.from('user_one_pagers').upsert(
    {
      user_id: user.id,
      view_title: viewTitle,
      summary_html: summaryHtml,
      deck_filename: deckFilename,
      deck_text: deckText,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
