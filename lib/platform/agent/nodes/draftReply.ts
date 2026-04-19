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
    'Write tight, investor-grade business prose grounded ONLY in the CONTEXT block.',
    'When you use a fact from a retrieved chunk labeled [S1], [S2], etc., cite that label in parentheses, e.g. ([S1]).',
    'If a number is missing, say what is missing; do not invent financials.',
    'Use Markdown for structure when appropriate.',
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
