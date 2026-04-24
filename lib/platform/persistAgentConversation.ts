import type { SupabaseClient } from '@supabase/supabase-js'
import type { AgentRagPayload } from '@/lib/platform/agent'
import type { AgentFileAction } from '@/lib/platform/agent/fileAction'

export function titleFromFirstMessage(message: string): string {
  const one = message.replace(/\s+/g, ' ').trim()
  if (!one) return 'New chat'
  return one.length > 80 ? `${one.slice(0, 77)}…` : one
}

/**
 * Ensure a workspace conversation row exists; create if needed. Scoped by user only (not by file).
 */
export async function ensureAgentConversation(params: {
  supabase: SupabaseClient
  userId: string
  conversationId: string | null
  firstUserMessage: string
}): Promise<{ conversationId: string } | { error: string; status: number }> {
  const { supabase, userId, conversationId, firstUserMessage } = params

  if (conversationId) {
    const { data: conv, error: cErr } = await supabase
      .from('agent_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (cErr) {
      return { error: cErr.message, status: 500 }
    }
    if (!conv) {
      return { error: 'Conversation not found.', status: 404 }
    }
    return { conversationId }
  }

  const title = titleFromFirstMessage(firstUserMessage)
  const now = new Date().toISOString()
  const { data: created, error: insErr } = await supabase
    .from('agent_conversations')
    .insert({
      user_id: userId,
      doc_id: null,
      title,
      updated_at: now,
    })
    .select('id')
    .single()

  if (insErr) {
    return { error: insErr.message, status: 500 }
  }
  if (!created?.id) {
    return { error: 'Could not create conversation.', status: 500 }
  }

  return { conversationId: created.id as string }
}

/**
 * Persist user + assistant after a successful model turn (avoids orphan user rows on failure).
 */
export async function insertAgentTurnMessages(params: {
  supabase: SupabaseClient
  userId: string
  conversationId: string
  userContent: string
  assistantContent: string
  rag: AgentRagPayload
  /** Focused file for this turn (RAG scope); stored on the user message for context. */
  contextDocId?: string | null
  fileAction?: AgentFileAction
}): Promise<{ error?: string }> {
  const { supabase, userId, conversationId, userContent, assistantContent, rag, contextDocId, fileAction } =
    params
  const t0 = new Date().toISOString()
  const t1 = new Date(Date.now() + 2).toISOString()

  const { count: priorCount } = await supabase
    .from('agent_messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  const isFirstTurn = (priorCount ?? 0) === 0

  const userMeta: Record<string, unknown> = {}
  if (contextDocId) userMeta.contextDocId = contextDocId

  const { error: uErr } = await supabase.from('agent_messages').insert({
    user_id: userId,
    conversation_id: conversationId,
    role: 'user',
    content: userContent,
    metadata: userMeta,
    created_at: t0,
  })
  if (uErr) {
    return { error: uErr.message }
  }

  const assistantMeta: Record<string, unknown> = { rag }
  if (fileAction && fileAction.type !== 'none') {
    assistantMeta.fileAction = fileAction
  }

  const { error: aErr } = await supabase.from('agent_messages').insert({
    user_id: userId,
    conversation_id: conversationId,
    role: 'assistant',
    content: assistantContent,
    metadata: assistantMeta as Record<string, unknown>,
    created_at: t1,
  })
  if (aErr) {
    return { error: aErr.message }
  }

  const newTitle = titleFromFirstMessage(userContent)
  const { error: tErr } = await supabase
    .from('agent_conversations')
    .update({
      updated_at: t1,
      ...(isFirstTurn ? { title: newTitle } : {}),
    })
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (tErr) {
    return { error: tErr.message }
  }

  return {}
}
