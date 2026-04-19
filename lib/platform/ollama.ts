/**
 * Central Ollama client for chat + embeddings (local SLM).
 * Env: LLAMA_BASE_URL, LLAMA_MODEL, LLAMA_FAST_MODEL, OLLAMA_EMBED_MODEL
 */

export const OLLAMA_DEFAULT_BASE = 'http://127.0.0.1:11434'

export function getOllamaBaseUrl(): string {
  return (process.env.LLAMA_BASE_URL || OLLAMA_DEFAULT_BASE).replace(/\/$/, '')
}

/** Primary agent / consistency model */
export function getOllamaChatModel(): string {
  return process.env.LLAMA_MODEL || 'qwen3:14b'
}

/** Context capture, claim extraction, ghost completions */
export function getOllamaFastModel(): string {
  return process.env.LLAMA_FAST_MODEL || process.env.LLAMA_SMALL_MODEL || 'qwen3:4b'
}

export function getOllamaEmbedModel(): string {
  return process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
}

export type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OllamaTagsResponse = {
  models?: Array<{ name?: string; model?: string }>
}

export async function ollamaListModelNames(baseUrl = getOllamaBaseUrl()): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`)
    if (!res.ok) return []
    const payload = (await res.json()) as OllamaTagsResponse
    return (payload.models || [])
      .map((m) => m.name || m.model || '')
      .filter(Boolean)
  } catch {
    return []
  }
}

/** Pick first available model from candidates, or first installed, or fallback. */
export async function resolveChatModel(
  preferred: string,
  candidates: string[],
  baseUrl = getOllamaBaseUrl()
): Promise<string> {
  const available = new Set(await ollamaListModelNames(baseUrl))
  if (available.has(preferred)) return preferred
  for (const c of candidates) {
    if (available.has(c)) return c
  }
  const first = [...available][0]
  return first || preferred
}

type OllamaChatResponse = {
  message?: { content?: string; thinking?: string }
  response?: string
}

export type OllamaChatOptions = {
  model: string
  messages: OllamaChatMessage[]
  stream?: false
  /** JSON Schema object for structured outputs (Ollama `format`). */
  format?: Record<string, unknown>
  temperature?: number
}

/**
 * Non-streaming chat. Use for extractors and agent nodes.
 */
export async function ollamaChat(opts: OllamaChatOptions): Promise<{ content: string; raw: unknown }> {
  const baseUrl = getOllamaBaseUrl()
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    stream: false,
  }
  if (opts.format) body.format = opts.format
  if (opts.temperature != null) {
    body.options = { temperature: opts.temperature }
  }

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const raw = (await res.json()) as OllamaChatResponse & { error?: string }

  if (!res.ok) {
    throw new Error(raw.error || `Ollama chat failed (${res.status})`)
  }

  const content = (raw.message?.content || raw.response || '').trim()
  return { content, raw }
}

type OllamaEmbedResponse = {
  embedding?: number[]
  embeddings?: number[][]
  error?: string
}

/**
 * Single-string embedding. Returns 768-dim vector for nomic-embed-text.
 */
export async function ollamaEmbed(input: string, model = getOllamaEmbedModel()): Promise<number[]> {
  const baseUrl = getOllamaBaseUrl()
  const res = await fetch(`${baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: input }),
  })
  const raw = (await res.json()) as OllamaEmbedResponse
  if (!res.ok) {
    throw new Error(raw.error || `Ollama embed failed (${res.status})`)
  }
  const vec = raw.embedding
  if (!vec?.length) {
    throw new Error('Ollama returned empty embedding')
  }
  return vec
}

/**
 * Remove thinking traces from model output before showing in editor.
 */
export function stripThinkingBlocks(content: string): string {
  let s = content
  const pairs: [string, string][] = [
    ['\u003cthink\u003e', '\u003c/think\u003e'],
    ['\u003credacted_thinking\u003e', '\u003c/redacted_thinking\u003e'],
  ]
  for (const [open, close] of pairs) {
    let start = s.indexOf(open)
    while (start !== -1) {
      const end = s.indexOf(close, start + open.length)
      if (end === -1) break
      s = s.slice(0, start) + s.slice(end + close.length)
      start = s.indexOf(open)
    }
  }
  return s.trim()
}
