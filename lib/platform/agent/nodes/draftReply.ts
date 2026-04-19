import { RontzenAgentState } from '@/lib/platform/agent/state'
import {
  getOllamaBaseUrl,
  getOllamaChatModel,
  ollamaChat,
  resolveChatModel,
  stripThinkingBlocks,
} from '@/lib/platform/ollama'

/**
 * Single node: draft assistant reply from user message + context (RAG + profile).
 * Extend with retrieve / consistency nodes in the same folder as the graph grows.
 */
export async function draftReplyNode(
  state: typeof RontzenAgentState.State
): Promise<Partial<typeof RontzenAgentState.State>> {
  const preferred = getOllamaChatModel()
  const baseUrl = getOllamaBaseUrl()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'qwen3:14b', 'llama3.2'], baseUrl)

  const system = [
    'You are Rontzen, a senior analyst for Series A/B companies.',
    'You reply in a product chat sidebar: short, direct, conversational.',
    'Ground every factual claim ONLY in the CONTEXT block. If something is not in context, say so plainly—do not invent numbers or events.',
    'Start with the answer in one or two sentences. Add a short bullet list only when it genuinely helps (e.g. multiple distinct items).',
    'Do not use essay-style intros or meta-framing (avoid phrases like "Based on the provided context", "From the documents", "I can answer as follows").',
    'Do not reference internal source labels like [S1] or [S2] in your reply; the UI already shows sources. Prefer "your deck", "the focused doc", or no citation when a fact is obvious from context.',
    'Use light Markdown (bold, short lists, `code` for field names) when it improves scanability.',
    'The user may switch files in the workspace; the ACTIVE FOCUSED DOCUMENT line (if present) is the file they have open for this turn—prioritize that file when they ask for edits or drafts for "this doc".',
  ].join('\n')

  const userPrompt = [
    'CONTEXT (company profile + retrieved doc excerpts):',
    state.contextBlock || '(none)',
    '',
    'USER REQUEST:',
    state.userMessage,
  ].join('\n')

  const { content } = await ollamaChat({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
  })

  return { assistantReply: stripThinkingBlocks(content) }
}
