import { coerceStoredEditorHtml } from '@/components/platform/editorHtml'
import {
  getOllamaBaseUrl,
  getOllamaChatModel,
  ollamaChat,
  resolveChatModel,
  stripThinkingBlocks,
} from '@/lib/platform/ollama'

const EDIT_MAX_PLAIN = 14_000

function extractBetween(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker)
  const end = text.indexOf(endMarker)
  if (start === -1 || end === -1 || end <= start) return ''
  return text.slice(start + startMarker.length, end).trim()
}

/**
 * Full-document edit: plain in / plain out (same marker contract as `/api/platform/edit-document`).
 */
export async function ollamaEditDocumentPlain(params: {
  instruction: string
  documentName: string
  currentPlain: string
}): Promise<{ summary: string; revisedPlain: string; model: string }> {
  const preferred = getOllamaChatModel()
  const baseUrl = getOllamaBaseUrl()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'qwen3:14b', 'llama3.2'], baseUrl)

  const current = params.currentPlain.slice(0, EDIT_MAX_PLAIN)
  const systemPrompt =
    'You are a precise editor for financial and investor-facing documents. Preserve facts and numbers unless the user asks to change them. Return ONLY the required markers—no preamble.'
  const userPrompt = [
    `Document name: ${params.documentName || 'Untitled document'}`,
    `Edit instruction: ${params.instruction}`,
    '',
    'Current document:',
    current,
    '',
    'Return EXACTLY in this format:',
    '<<<SUMMARY>>>',
    '<1-2 sentence summary of edits>',
    '<<<END_SUMMARY>>>',
    '<<<REVISED_DOCUMENT>>>',
    '<full revised document text>',
    '<<<END_REVISED_DOCUMENT>>>',
  ].join('\n')

  const { content: raw } = await ollamaChat({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.15,
  })

  const text = stripThinkingBlocks(raw)
  const revisedContent =
    extractBetween(text, '<<<REVISED_DOCUMENT>>>', '<<<END_REVISED_DOCUMENT>>>') || text
  const summary =
    extractBetween(text, '<<<SUMMARY>>>', '<<<END_SUMMARY>>>') ||
    'Draft updated. Use Keep or Undo below the editor.'

  return { summary, revisedPlain: revisedContent.trim(), model }
}

/**
 * New workspace document from user instruction; body is Markdown → HTML via `coerceStoredEditorHtml` downstream.
 */
export async function ollamaDraftNewFinancialDocument(params: {
  instruction: string
  contextBlock: string
}): Promise<{ title: string; bodyMarkdown: string; summary: string; model: string }> {
  const preferred = getOllamaChatModel()
  const baseUrl = getOllamaBaseUrl()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'qwen3:14b', 'llama3.2'], baseUrl)

  const system = [
    'You draft concise, professional financial / investor workspace documents (memos, deck outlines, assumption lists, cap table shells, etc.).',
    'Use Markdown: ## / ### headings, bullet lists, and tables where helpful.',
    'Use clear placeholders like [TBD] or $[X]M where numbers are unknown—do not invent financials.',
    'Return ONLY the required markers—no preamble.',
  ].join('\n')

  const userPrompt = [
    'WORKSPACE CONTEXT (may include company profile and retrieved excerpts; use only as hints):',
    params.contextBlock.slice(0, 12_000) || '(none)',
    '',
    'USER REQUEST:',
    params.instruction,
    '',
    'Return EXACTLY:',
    '<<<SUMMARY>>>',
    '<1-2 sentences on what you created>',
    '<<<END_SUMMARY>>>',
    '<<<TITLE>>>',
    '<short document title, no quotes>',
    '<<<END_TITLE>>>',
    '<<<BODY>>>',
    '<full Markdown body>',
    '<<<END_BODY>>>',
  ].join('\n')

  const { content: raw } = await ollamaChat({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.25,
  })

  const text = stripThinkingBlocks(raw)
  let title = extractBetween(text, '<<<TITLE>>>', '<<<END_TITLE>>>')
  let bodyMarkdown = extractBetween(text, '<<<BODY>>>', '<<<END_BODY>>>')
  const summary =
    extractBetween(text, '<<<SUMMARY>>>', '<<<END_SUMMARY>>>') ||
    'New document drafted. Use Keep or Undo below the editor.'

  if (!bodyMarkdown.trim()) {
    bodyMarkdown = text
  }
  if (!title.trim()) {
    const firstHeading = bodyMarkdown.match(/^#\s+(.+)$/m)
    title = firstHeading?.[1]?.trim() || 'Untitled draft'
  }

  return {
    title: title.slice(0, 500),
    bodyMarkdown: bodyMarkdown.trim(),
    summary: summary.trim(),
    model,
  }
}

export function plainOrMarkdownToEditorHtml(text: string): string {
  return coerceStoredEditorHtml(text.trim())
}
