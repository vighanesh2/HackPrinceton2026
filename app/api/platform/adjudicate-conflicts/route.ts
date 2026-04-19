/**
 * Optional Ollama adjudication API (non-deterministic). The platform UI no longer calls this —
 * conflicts use `filterConflictsDeterministic` for stable, refresh-safe results.
 */
import { NextResponse } from 'next/server'
import { extractJsonObject } from '@/lib/platform/smartFill'

export type AdjudicationItem = {
  index: number
  key: string
  label: string
  valueA: string
  valueB: string
  titleA: string
  titleB: string
  evidenceA: string | null
  evidenceB: string | null
}

type Body = {
  items?: AdjudicationItem[]
}

type OllamaTagResponse = {
  models?: Array<{ name?: string; model?: string }>
}

function normalizeOllamaBaseUrl(raw: string | undefined): string {
  return (raw || 'http://localhost:11434').trim().replace(/\/+$/, '')
}

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const maybePayload = payload as { response?: string; message?: { content?: string } }
  return (maybePayload.message?.content || maybePayload.response || '').trim()
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

function parseKeptIndices(obj: Record<string, unknown>): number[] | null {
  if (Array.isArray(obj.keptIndices)) {
    const xs = obj.keptIndices.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    return xs.length ? xs : []
  }
  if (Array.isArray(obj.results)) {
    const out: number[] = []
    for (const row of obj.results) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      if (r.keep === true && typeof r.index === 'number') out.push(r.index)
    }
    return out
  }
  if (Array.isArray(obj.keep)) {
    return obj.keep.filter((x): x is number => typeof x === 'number')
  }
  return null
}

function buildUserPrompt(items: AdjudicationItem[]): string {
  const lines = items.map(
    (it) =>
      `[${it.index}] ${it.label} (${it.key})
  Doc A "${it.titleA}": ${it.valueA}
  Evidence A: ${it.evidenceA ?? '(none)'}
  Doc B "${it.titleB}": ${it.valueB}
  Evidence B: ${it.evidenceB ?? '(none)'}`
  )

  return `You are a financial document QA expert. Below are candidate "conflicts": two documents each have an extracted number for the SAME field label (Raise, Monthly burn, Customers, etc.).

Your job: decide which rows are **real conflicts** that a human should reconcile (same metric, same meaning, genuinely different numbers).

Mark as **NOT a real conflict** (exclude from output) when:
- The numbers likely refer to **different metrics** even if the pipeline labeled them the same (e.g. pre-money valuation vs round size both mis-tagged as "Raise").
- **Extraction/OCR is likely wrong** or one value is implausible for the label (e.g. "Monthly burn" of tens of millions USD for a startup Series A deck is almost never literal monthly cash burn; often a different line item was captured).
- **Different time periods, units, or definitions** (runway vs burn, TTM vs monthly, "customers" vs "logos" vs pipeline).
- One side is **0, missing context, or placeholder** while the other is a real count — treat as unreliable unless evidence clearly matches.
- **Evidence** clearly shows one line is about valuation/financing structure and the other about operating metrics.

Be conservative: only **keep** rows where both sides plausibly report the same kind of figure and a human would care about the mismatch.

Candidates:
${lines.join('\n\n')}

Return ONLY valid JSON, no markdown fences, no other text:
{"keptIndices":[0,2]}
where keptIndices lists the **index numbers shown in brackets** above (same integers as in [n]) for rows that ARE real conflicts. Omit false positives. If none, return {"keptIndices":[]}.`
}

async function adjudicateWithOllama(items: AdjudicationItem[]): Promise<number[] | null> {
  const baseUrl = normalizeOllamaBaseUrl(process.env.LLAMA_BASE_URL)
  const preferredModel =
    process.env.LLAMA_FAST_MODEL?.trim() ||
    process.env.LLAMA_MODEL?.trim() ||
    'llama3.2'

  const systemPrompt =
    'You are a precise JSON-only assistant. Output a single JSON object with key keptIndices (array of integers). No markdown, no explanation.'

  const userPrompt = buildUserPrompt(items)

  async function chat(model: string) {
    return fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
  }

  let usedModel = preferredModel
  let res = await chat(usedModel)

  if (res.status === 404) {
    const availableModels = await listAvailableModels(baseUrl)
    const fallbackModel = availableModels[0]
    if (fallbackModel) {
      usedModel = fallbackModel
      res = await chat(usedModel)
    }
  }

  if (!res.ok) {
    const details = await res.text()
    console.warn('[adjudicate-conflicts] Ollama', res.status, details.slice(0, 400))
    return null
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    return null
  }

  const text = extractAssistantText(payload)
  const parsed = extractJsonObject(text)
  if (!parsed) {
    console.warn('[adjudicate-conflicts] Could not parse JSON from model', text.slice(0, 200))
    return null
  }

  const kept = parseKeptIndices(parsed)
  if (kept === null) return null
  return kept
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const items = Array.isArray(body.items) ? body.items : []
    if (!items.length) {
      return NextResponse.json({ keptIndices: [], skipped: false })
    }

    const capped = items.slice(0, 32)
    const kept = await adjudicateWithOllama(capped)
    if (kept === null) {
      return NextResponse.json({
        keptIndices: null,
        skipped: true,
        message:
          'Ollama adjudication failed. Check LLAMA_BASE_URL, pull the model (e.g. ollama pull), and try again.',
      })
    }

    return NextResponse.json({ keptIndices: kept, skipped: false })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Adjudication failed.', keptIndices: null, skipped: true },
      { status: 500 }
    )
  }
}
