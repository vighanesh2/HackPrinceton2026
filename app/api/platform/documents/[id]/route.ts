import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PatchBody = {
  title?: string
  body_html?: string
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const id = params.id?.trim()
    if (!id) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    const body = (await request.json()) as PatchBody
    const patch: Record<string, unknown> = {}

    if (body.title !== undefined) {
      patch.title = String(body.title).trim().slice(0, 500) || 'Untitled'
    }
    if (body.body_html !== undefined) {
      patch.body_html = String(body.body_html)
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const { data: prior } = await supabase
      .from('documents')
      .select('title, body_html')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    patch.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('documents')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, doc_type, title, body_html, updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    if (prior && body.body_html !== undefined && prior.body_html !== data.body_html) {
      const display =
        (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
        user.email ||
        'You'
      await supabase.from('document_edits').insert({
        user_id: user.id,
        doc_id: id,
        author_id: user.id,
        author_display: display,
        source: 'user',
        action: 'replace',
        text_before: (prior.body_html ?? '').slice(0, 8000),
        text_after: (data.body_html ?? '').slice(0, 8000),
        diff_stats: {
          beforeLen: (prior.body_html ?? '').length,
          afterLen: (data.body_html ?? '').length,
        },
      })
    }

    return NextResponse.json({ document: data })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'documents patch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const id = params.id?.trim()
    if (!id) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'documents delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
