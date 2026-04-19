import type { SupabaseClient } from '@supabase/supabase-js'
import { buildAgentContextBlockWithMeta } from '@/lib/platform/buildAgentContext'
import {
  getOllamaBaseUrl,
  getOllamaChatModel,
  ollamaChat,
  resolveChatModel,
  stripThinkingBlocks,
} from '@/lib/platform/ollama'

/**
 * One chat turn with profile + hybrid chunk retrieval + shared Ollama client.
 */
export async function completeRagChatTurn(params: {
  supabase: SupabaseClient
  userId: string
  userMessage: string
  docId?: string | null
  callerContext?: string | null
  conversationBlock: string
  documentNamesLine: string
}): Promise<{
  answer: string
  model: string
  rag: {
    chunkCount: number
    queryTooShort: boolean
    fallbackExcerptApplied: boolean
    sourceCount: number
  }
}> {
  const meta = await buildAgentContextBlockWithMeta(params.supabase, {
    userId: params.userId,
    userMessage: params.userMessage,
    docId: params.docId ?? null,
  })
  let block = meta.block
  const { chunkCount, queryTooShort, fallbackExcerptApplied, sources } = meta
  if (params.callerContext?.trim()) {
    block += `\n\nCALLER-PROVIDED CONTEXT:\n${params.callerContext.trim().slice(0, 24_000)}`
  }

  const baseUrl = getOllamaBaseUrl()
  const preferred = getOllamaChatModel()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'qwen3:14b', 'llama3.2'], baseUrl)

  const systemPrompt = [
    'You are an AI analyst for startup and SME business documents.',
    'Reply like a teammate in a chat: lead with the direct answer, keep it concise.',
    'Ground claims in the provided context. If context is missing for a claim, say what is missing—do not invent.',
    'Do not use boilerplate intros ("Based on the provided context", "From the documents"). Do not cite internal labels like [S1] or [S2] in your answer.',
    params.documentNamesLine,
  ].join('\n')

  const userContent = [
    'BUSINESS CONTEXT:',
    block,
    '',
    'RECENT CONVERSATION:',
    params.conversationBlock || 'No history yet.',
    '',
    `USER QUESTION: ${params.userMessage}`,
    '',
    'Return concise, practical guidance. Mention assumptions only when they matter.',
  ].join('\n')

  const { content } = await ollamaChat({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
  })

  return {
    answer: stripThinkingBlocks(content),
    model,
    rag: {
      chunkCount,
      queryTooShort,
      fallbackExcerptApplied,
      sourceCount: sources.length,
    },
  }
}

/**
 * Non-RAG chat path (caller-supplied context only), same Ollama resolution as RAG.
 */
export async function completeDeckOnlyChatTurn(params: {
  userMessage: string
  context: string
  conversationBlock: string
  documentNamesLine: string
}): Promise<{ answer: string; model: string }> {
  const baseUrl = getOllamaBaseUrl()
  const preferred = getOllamaChatModel()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'qwen3:14b', 'llama3.2'], baseUrl)

  const systemPrompt = [
    'You are an AI analyst for startup and SME business documents.',
    'Reply in a chat sidebar tone: direct answer first, minimal fluff.',
    'Ground claims in the provided context. If context is missing for a claim, say what is missing.',
    'Avoid boilerplate intros ("Based on the provided context", "From the documents").',
    params.documentNamesLine,
  ].join('\n')

  const userContent = [
    'BUSINESS CONTEXT:',
    params.context,
    '',
    'RECENT CONVERSATION:',
    params.conversationBlock || 'No history yet.',
    '',
    `USER QUESTION: ${params.userMessage}`,
    '',
    'Return concise, practical guidance. Mention assumptions only when they matter.',
  ].join('\n')

  const { content } = await ollamaChat({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
  })

  return { answer: stripThinkingBlocks(content), model }
}
