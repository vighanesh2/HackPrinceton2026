import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeDeckOnlyChatTurn, completeRagChatTurn } from '@/lib/platform/ragTurn'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequestBody = {
  message?: string
  history?: ChatMessage[]
  context?: string
  documents?: Array<{ name?: string }>
  /** When true (requires signed-in user), prepend company profile + retrieved chunks. */
  rag?: boolean
  /** Scope vector search to this workspace document (optional). */
  docId?: string | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const userMessage = body.message?.trim()

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const safeHistory = (body.history || []).slice(-10)
    const conversationBlock = safeHistory
      .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
      .join('\n')

    const documentNames = (body.documents || [])
      .map((document) => document.name)
      .filter(Boolean)
      .join(', ')

    const documentNamesLine = documentNames
      ? `Active documents: ${documentNames}`
      : 'Active documents: none'

    if (body.rag) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Sign in to use RAG mode (`rag: true`), or omit `rag` for deck-only context.' },
          { status: 401 }
        )
      }

      const { answer, model, rag } = await completeRagChatTurn({
        supabase,
        userId: user.id,
        userMessage,
        docId: body.docId?.trim() || null,
        callerContext: body.context?.trim() || null,
        conversationBlock,
        documentNamesLine,
      })

      if (!answer) {
        return NextResponse.json({ error: 'LLaMA returned an empty response.' }, { status: 502 })
      }

      return NextResponse.json({
        answer,
        model,
        rag,
      })
    }

    let context = body.context || 'No business documents provided.'
    const { answer, model } = await completeDeckOnlyChatTurn({
      userMessage,
      context,
      conversationBlock,
      documentNamesLine,
    })

    if (!answer) {
      return NextResponse.json({ error: 'LLaMA returned an empty response.' }, { status: 502 })
    }

    return NextResponse.json({
      answer,
      model,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while processing chat request.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
