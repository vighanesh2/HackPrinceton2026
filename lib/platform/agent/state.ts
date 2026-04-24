import { Annotation } from '@langchain/langgraph'

/**
 * LangGraph state for the Rontzen document agent.
 * Keep all agent graph definitions under `lib/platform/agent/` for isolated git workflows.
 */
export const RontzenAgentState = Annotation.Root({
  /** Latest user instruction (draft / fix / Q&A). */
  userMessage: Annotation<string>(),
  /** Active workspace document for scoped chunk retrieval (optional). */
  docId: Annotation<string | null>(),
  /** Profile + retrieved chunks (filled by the retrieve node). */
  contextBlock: Annotation<string>(),
  /** Chunks merged into context after hybrid search (0 if query short or none indexed). */
  ragChunkCount: Annotation<number>(),
  /** Embedding search skipped (message too short). */
  queryTooShort: Annotation<boolean>(),
  /** Live doc excerpt added when vector retrieval returned nothing. */
  fallbackExcerptApplied: Annotation<boolean>(),
  /** Citation labels [S1]… aligned with CONTEXT block. */
  ragSources: Annotation<
    Array<{ sourceIndex: number; chunkId: string; docId: string; preview: string }>
  >(),
  /** Model output for this turn. */
  assistantReply: Annotation<string>(),
  /** Extra system lines for this turn (e.g. empty-workspace onboarding). */
  systemAddendum: Annotation<string>(),
})

export type RontzenAgentStateType = typeof RontzenAgentState.State
