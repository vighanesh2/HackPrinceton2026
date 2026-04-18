import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_COMPETITIVE_HTML = 500_000

type SizingPayload = {
  tam: number
  sam: number
  som: number
}

function parseSizing(raw: unknown): SizingPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const tam = Number(o.tam)
  const sam = Number(o.sam)
  const som = Number(o.som)
  if (![tam, sam, som].every((n) => Number.isFinite(n) && n >= 0)) return null
  return { tam, sam, som }
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_market_workspace')
    .select('sizing, competitive_html, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[api/platform/market GET]', error.message, error.code, error.details, error.hint)
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ record: null })
  }

  const sizing = parseSizing(data.sizing)
  if (!sizing) {
    return NextResponse.json({ record: null })
  }

  return NextResponse.json({
    record: {
      sizing,
      competitive_html: typeof data.competitive_html === 'string' ? data.competitive_html : '',
    },
  })
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
  const sizing = parseSizing(b.sizing)
  if (!sizing) {
    return NextResponse.json({ error: 'Invalid sizing: expected { tam, sam, som } non-negative numbers' }, { status: 400 })
  }

  let competitiveHtml = typeof b.competitiveHtml === 'string' ? b.competitiveHtml : ''
  if (competitiveHtml.length > MAX_COMPETITIVE_HTML) {
    competitiveHtml = competitiveHtml.slice(0, MAX_COMPETITIVE_HTML)
  }

  const { error } = await supabase.from('user_market_workspace').upsert(
    {
      user_id: user.id,
      sizing,
      competitive_html: competitiveHtml,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('[api/platform/market PUT]', error.message, error.code, error.details, error.hint)
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
