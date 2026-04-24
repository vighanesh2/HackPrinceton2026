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

/**
 * Node's fetch often throws `TypeError: fetch failed` with a nested `cause` (e.g. ECONNREFUSED).
 * Surface a message the UI can show instead of the opaque default.
 */
function explainOllamaNetworkError(err: unknown, baseUrl: string): Error {
  if (!(err instanceof Error)) {
    return new Error(String(err))
  }
  const cause = err.cause
  const code =
    cause && typeof cause === 'object' && 'code' in cause
      ? String((cause as { code?: unknown }).code)
      : ''
  const causeMsg =
    cause && typeof cause === 'object' && 'message' in cause
      ? String((cause as { message?: unknown }).message)
      : ''
  const isNetFail =
    err.message === 'fetch failed' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === 'EAI_AGAIN'
  if (isNetFail) {
    return new Error(
      `Cannot reach Ollama at ${baseUrl} (${code || causeMsg || 'network error'}). ` +
        `Start the Ollama app (or run \`ollama serve\`). ` +
        `Confirm \`${baseUrl}/api/tags\` loads. ` +
        `If Ollama runs on another host/port, set LLAMA_BASE_URL in .env.local and restart Next.js.`
    )
  }
  return err
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

  let res: Response
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    throw explainOllamaNetworkError(e, baseUrl)
  }

  let raw: OllamaChatResponse & { error?: string }
  try {
    raw = (await res.json()) as OllamaChatResponse & { error?: string }
  } catch {
    throw new Error(`Ollama returned a non-JSON body (${res.status}) at ${baseUrl}/api/chat`)
  }

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
  let res: Response
  try {
    res = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: input }),
    })
  } catch (e) {
    throw explainOllamaNetworkError(e, baseUrl)
  }

  let raw: OllamaEmbedResponse
  try {
    raw = (await res.json()) as OllamaEmbedResponse
  } catch {
    throw new Error(`Ollama returned a non-JSON body (${res.status}) at ${baseUrl}/api/embeddings`)
  }
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
