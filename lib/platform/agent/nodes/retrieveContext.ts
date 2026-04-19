import type { SupabaseClient } from '@supabase/supabase-js'
import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import { RontzenAgentState } from '@/lib/platform/agent/state'
import { buildAgentContextBlockWithMeta } from '@/lib/platform/buildAgentContext'

type AgentConfigurable = {
  supabase?: SupabaseClient
  userId?: string
}

/**
 * First-class retrieve step: embed query, hybrid search, assemble profile + chunk text.
 */
export async function retrieveContextNode(
  state: typeof RontzenAgentState.State,
  config: LangGraphRunnableConfig<AgentConfigurable>
): Promise<Partial<typeof RontzenAgentState.State>> {
  const supabase = config.configurable?.supabase
  const userId = config.configurable?.userId
  if (!supabase || !userId) {
    return {
      contextBlock: 'RETRIEVAL: missing server configuration (supabase session).',
      ragChunkCount: 0,
      queryTooShort: false,
      fallbackExcerptApplied: false,
      ragSources: [],
    }
  }

  const meta = await buildAgentContextBlockWithMeta(supabase, {
    userId,
    userMessage: state.userMessage,
    docId: state.docId ?? null,
  })

  return {
    contextBlock: meta.block,
    ragChunkCount: meta.chunkCount,
    queryTooShort: meta.queryTooShort,
    fallbackExcerptApplied: meta.fallbackExcerptApplied,
    ragSources: meta.sources,
  }
}
