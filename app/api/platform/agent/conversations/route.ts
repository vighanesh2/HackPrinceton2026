import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** List workspace conversations for the user, newest first (not per-file). */
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
      .from('agent_conversations')
      .select('id, doc_id, title, updated_at, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Apply migrations through 20260422120000_agent_workspace_chat.sql if agent tables are missing or out of date.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversations: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'list conversations failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Create a new workspace conversation thread. */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = (await request.json()) as { title?: string }
    const title = (body.title?.trim() || 'New chat').slice(0, 200)
    const now = new Date().toISOString()

    const { data: row, error } = await supabase
      .from('agent_conversations')
      .insert({
        user_id: user.id,
        doc_id: null,
        title,
        updated_at: now,
      })
      .select('id, doc_id, title, updated_at, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversation: row })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'create conversation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
