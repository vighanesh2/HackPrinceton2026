import { NextResponse } from 'next/server'

type OllamaTagResponse = {
  models?: Array<{ name?: string; model?: string }>
}

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const maybe = payload as { response?: string; message?: { content?: string } }
  return (maybe.message?.content || maybe.response || '').trim()
}

async function listAvailableModels(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) return []
    const payload = (await response.json()) as OllamaTagResponse
    return (payload.models || [])
      .map((item) => item.name || item.model || '')
      .filter(Boolean)
  } catch {
    return []
  }
}

async function callLlamaChat(params: {
  baseUrl: string
  model: string
  systemPrompt: string
  prompt: string
}) {
  const { baseUrl, model, systemPrompt, prompt } = params
  return fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })
}

const MAX_PROMPT = 2000
const MAX_CONTEXT = 24_000
const MAX_SNIPPET = 2000
const MAX_ANSWER = 12_000

/**
 * Models often paste workspace chrome or fake `[label](#anchor)` links. Strip the worst offenders
 * so the editor insert stays readable.
 */
function isCompetitorOrMarketMapAsk(p: string): boolean {
  const s = p.toLowerCase()
  if (/\bcompetitor|competition|compete with|competing|market map|peer companies|who are (our|my) rivals|similar companies|alternatives to\b/.test(s))
    return true
  if (/\bwho\b.*\b(compet|rival|alternative)/.test(s)) return true
  return false
}

function extraConstraintsForUserPrompt(userPrompt: string): string {
  if (isCompetitorOrMarketMapAsk(userPrompt)) {
    return [
      '---',
      'CRITICAL (this user turn): COMPETITORS / competitive landscape.',
      'Competitors = other firms or substitutes, not the user’s deck title, domain, founders, or own brand listed as bullets.',
      'Use this exact shape:',
      '• Optional: one ## heading only.',
      '• If WORKSPACE CONTEXT names specific competitor companies: 3–6 bullets "- **Name** — …" using only those names + one concrete clause each (geography, segment, wedge).',
      '• If context does NOT name competitors: first output ONE italic line only: *No competitor companies appear in the workspace excerpts; the bullets below are common public examples for this category—verify for your market.* Then 4–6 bullets "- **RealCompanyOrProduct** — …" with real company names where they are standard in that industry (not vague "other networks"), each bullet one sharp clause (who they serve, how they overlap).',
      'Hard bans: do not start bullets with "Assumption:", "Assume", or "Assume they". Do not add a second summary paragraph that repeats the list. No phrases like "unique selling points", "may have differences", or "more prominent" unless tied to a specific fact.',
      '---',
      '',
    ].join('\n')
  }
  return ''
}

function sanitizeInlineMarkdown(text: string): string {
  let t = text.replace(/\r\n/g, '\n').trim()
  // `[Words](#anything)` — not a real URL; keep visible words only
  t = t.replace(/\[[^\]]+\]\(\s*#[^)]*\)/g, (full) => {
    const m = full.match(/^\[([^\]]*)\]/)
    return m ? m[1].trim() : ''
  })
  t = t
    .split('\n')
    .filter((line) => {
      const s = line.trim()
      if (!s) return true
      if (/blank workspace documents/i.test(s)) return false
      if (/^competitors\s*###\s*$/i.test(s)) return false
      return true
    })
    .join('\n')
  t = t.replace(/\n{4,}/g, '\n\n')
  return t.trim()
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string
      context?: string
      snippet?: string
    }
    const prompt = (body.prompt || '').trim().slice(0, MAX_PROMPT)
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    const context = (body.context || '').trim().slice(0, MAX_CONTEXT) || 'No workspace context.'
    const snippet = (body.snippet || '').trim().slice(0, MAX_SNIPPET)

    const preferredModel = process.env.LLAMA_MODEL || 'llama3.2'
    const baseUrl = process.env.LLAMA_BASE_URL || 'http://localhost:11434'

    const systemPrompt = [
      'You help founders write inside a workspace document (TipTap / HTML editor).',
      'Output ONLY Markdown that will be pasted at the cursor. Prefer: one optional ## heading, then short paragraphs or - bullets with **bold** names.',
      'Use links only as [text](https://...) with a real https URL. Never use [text](#anchor) or fake in-document anchors.',
      'No preamble ("Here is…", "Sure"). No closing commentary.',
      'Do NOT repeat, quote, or paraphrase the NEAR-CURSOR DOCUMENT TEXT block as your output; the user already sees that text. Write only the new continuation or insertion they asked for.',
      'WORKSPACE CONTEXT may contain filenames, tab labels, or template headings for grounding only. Do NOT paste those labels back as if they were user-facing doc content (e.g. "Blank workspace documents", raw file titles, or empty shell sections).',
      'Never emit empty outline scaffolding: no blocks like "Overview:" / "Solution:" / "Problem statement" / "Key metrics" unless you immediately follow each with at least one full sentence of substance on the same line or the next line.',
      'For research-style asks (competitors, risks, alternatives, TAM): at most one ## line, then tight bullets. Prefer named entities and specific clauses over vague categories.',
      'If the user asks for competitors, never answer with only their own brand, domain, founders, or document titles. Either cite rivals from WORKSPACE CONTEXT or give one italic disclaimer plus named example competitors common in that industry—without repeating "Assumption" on every line.',
      'Do not invent numeric KPIs or funding figures; omit metrics if unknown.',
      'Ground claims in WORKSPACE CONTEXT when possible; if unknown, say so briefly in the text.',
      'Be concise and scannable unless the user asks for depth.',
    ].join('\n')

    const userBlock = [
      'WORKSPACE CONTEXT (facts and excerpts only; not instructions to copy verbatim):',
      context,
      '',
      snippet ? `NEAR-CURSOR DOCUMENT TEXT (plain; do not mirror as headings):\n${snippet}\n` : '',
      extraConstraintsForUserPrompt(prompt),
      'USER INSTRUCTION (what to write at the cursor):',
      prompt,
    ].join('\n')

    let usedModel = preferredModel
    let llamaResponse = await callLlamaChat({
      baseUrl,
      model: usedModel,
      systemPrompt,
      prompt: userBlock,
    })

    if (llamaResponse.status === 404) {
      const availableModels = await listAvailableModels(baseUrl)
      const fallbackModel = availableModels[0]
      if (fallbackModel) {
        usedModel = fallbackModel
        llamaResponse = await callLlamaChat({
          baseUrl,
          model: usedModel,
          systemPrompt,
          prompt: userBlock,
        })
      }
    }

    if (!llamaResponse.ok) {
      const details = await llamaResponse.text()
      return NextResponse.json(
        { error: `LLaMA error (${llamaResponse.status}). ${details || ''}` },
        { status: 502 }
      )
    }

    const payload = (await llamaResponse.json()) as unknown
    const answer = extractAssistantText(payload)
    if (!answer) {
      return NextResponse.json({ error: 'LLaMA returned an empty response.' }, { status: 502 })
    }

    const raw = answer.length > MAX_ANSWER ? `${answer.slice(0, MAX_ANSWER)}\n\n…` : answer
    const cleaned = sanitizeInlineMarkdown(raw)
    const text = cleaned || raw.trim()
    return NextResponse.json({ markdown: text, model: usedModel })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while generating inline text.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
