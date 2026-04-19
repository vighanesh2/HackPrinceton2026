import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runRontzenAgentTurn } from '@/lib/platform/agent'
import {
  ensureAgentConversation,
  insertAgentTurnMessages,
} from '@/lib/platform/persistAgentConversation'

type Body = {
  message?: string
  docId?: string | null
  conversationId?: string | null
}

/**
 * LangGraph-backed agent turn. Conversation history is workspace-wide; `docId` is the focused
 * file for RAG (optional). Persistence always runs when the user is authenticated.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    const message = body.message?.trim()
    if (!message) {
      return NextResponse.json({ error: 'message is required.' }, { status: 400 })
    }

    const docId = body.docId?.trim() || null
    const conversationIdIn = body.conversationId?.trim() || null

    const { assistantReply, rag } = await runRontzenAgentTurn({
      userMessage: message,
      docId,
      supabase,
      userId: user.id,
    })

    if (!assistantReply.trim()) {
      return NextResponse.json({ error: 'Agent returned an empty reply.' }, { status: 502 })
    }

    const ensured = await ensureAgentConversation({
      supabase,
      userId: user.id,
      conversationId: conversationIdIn,
      firstUserMessage: message,
    })

    if ('error' in ensured) {
      return NextResponse.json({
        answer: assistantReply,
        rag,
        conversationId: null as string | null,
        conversationError: ensured.error,
      })
    }

    const persist = await insertAgentTurnMessages({
      supabase,
      userId: user.id,
      conversationId: ensured.conversationId,
      userContent: message,
      assistantContent: assistantReply,
      rag,
      contextDocId: docId,
    })

    if (persist.error) {
      return NextResponse.json({
        answer: assistantReply,
        rag,
        conversationId: ensured.conversationId,
        persistError: persist.error,
      })
    }

    return NextResponse.json({
      answer: assistantReply,
      rag,
      conversationId: ensured.conversationId,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'agent failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
