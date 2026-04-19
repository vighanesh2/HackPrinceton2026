import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Default row type until `index-document` classifies from content (server-only). */
const DEFAULT_DOC_TYPE = 'board_memo' as const

/** List workspace documents for the signed-in user. */
export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, doc_type, title, body_html, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'documents list failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type PostBody = {
  title?: string
  body_html?: string
}

/** Create a document row. `doc_type` is assigned by the indexer after save, not the client. */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = (await request.json()) as PostBody
    const title = (body.title?.trim() || 'Untitled').slice(0, 500)
    const body_html = typeof body.body_html === 'string' ? body.body_html : ''

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        doc_type: DEFAULT_DOC_TYPE,
        title,
        body_html,
      })
      .select('id, doc_type, title, body_html, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'documents create failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
