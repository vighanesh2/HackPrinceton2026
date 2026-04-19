import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const conversationId = params.id?.trim()
    if (!conversationId) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    const { data: conv, error: cErr } = await supabase
      .from('agent_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500 })
    }
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('agent_messages')
      .select('id, conversation_id, role, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'list messages failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
