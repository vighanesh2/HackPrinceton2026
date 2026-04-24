/**
 * Rontzen LangGraph agent — keep imports scoped to this directory for selective commits.
 */
export { RontzenAgentState, type RontzenAgentStateType } from '@/lib/platform/agent/state'
export { buildRontzenAgentGraph, getRontzenAgentGraph } from '@/lib/platform/agent/graph'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getRontzenAgentGraph } from '@/lib/platform/agent/graph'

export type AgentRagPayload = {
  chunkCount: number
  queryTooShort: boolean
  fallbackExcerptApplied: boolean
  sources: Array<{ sourceIndex: number; chunkId: string; docId: string; preview: string }>
}

export async function runRontzenAgentTurn(input: {
  userMessage: string
  docId: string | null
  supabase: SupabaseClient
  userId: string
  systemAddendum?: string
}): Promise<{ assistantReply: string; rag: AgentRagPayload }> {
  const graph = getRontzenAgentGraph()
  const result = await graph.invoke(
    {
      userMessage: input.userMessage,
      docId: input.docId,
      contextBlock: '',
      ragChunkCount: 0,
      queryTooShort: false,
      fallbackExcerptApplied: false,
      ragSources: [],
      assistantReply: '',
      systemAddendum: input.systemAddendum ?? '',
    },
    {
      configurable: {
        supabase: input.supabase,
        userId: input.userId,
      },
    }
  )
  return {
    assistantReply: result.assistantReply || '',
    rag: {
      chunkCount: result.ragChunkCount ?? 0,
      queryTooShort: result.queryTooShort ?? false,
      fallbackExcerptApplied: result.fallbackExcerptApplied ?? false,
      sources: result.ragSources ?? [],
    },
  }
}
