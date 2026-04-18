import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'pitch-decks'
const EMBEDDED_NAME = 'embedded.pdf'
const SIGNED_URL_SECONDS = 3600

function embeddedObjectKey(userId: string) {
  return `${userId}/${EMBEDDED_NAME}`
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: row, error } = await supabase
    .from('user_pitch_decks')
    .select('filename, mime, object_key, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[api/platform/pitch-deck GET]', error.message, error.code, error.details, error.hint)
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }

  if (!row?.object_key) {
    return NextResponse.json({ record: null })
  }

  if (row.object_key !== embeddedObjectKey(user.id)) {
    return NextResponse.json({ error: 'Invalid stored path' }, { status: 500 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.object_key, SIGNED_URL_SECONDS)

  if (signError || !signed?.signedUrl) {
    console.error('[api/platform/pitch-deck GET] sign', signError?.message, signError)
    return NextResponse.json({ error: signError?.message || 'Could not sign download URL' }, { status: 500 })
  }

  return NextResponse.json({
    record: {
      filename: row.filename,
      mime: row.mime,
      signedUrl: signed.signedUrl,
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
  const filename =
    typeof b.filename === 'string' && b.filename.trim() ? b.filename.trim().slice(0, 500) : 'deck.pdf'
  const mime =
    typeof b.mime === 'string' && b.mime.trim() ? b.mime.trim().slice(0, 200) : 'application/pdf'

  const objectKey = embeddedObjectKey(user.id)

  const { error } = await supabase.from('user_pitch_decks').upsert(
    {
      user_id: user.id,
      filename,
      mime,
      object_key: objectKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('[api/platform/pitch-deck PUT]', error.message, error.code, error.details, error.hint)
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const objectKey = embeddedObjectKey(user.id)

  const { error: removeError } = await supabase.storage.from(BUCKET).remove([objectKey])
  if (removeError) {
    console.warn('[api/platform/pitch-deck DELETE] storage', removeError.message)
  }

  const { error } = await supabase.from('user_pitch_decks').delete().eq('user_id', user.id)
  if (error) {
    console.error('[api/platform/pitch-deck DELETE]', error.message, error.code, error.details, error.hint)
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
