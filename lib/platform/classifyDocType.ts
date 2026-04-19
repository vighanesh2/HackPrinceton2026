import type { DocType } from '@/lib/platform/types'
import { getOllamaEmbedModel, ollamaEmbed } from '@/lib/platform/ollama'

/** Allowed workspace template buckets (single source for classification). */
export const CLASSIFIABLE_DOC_TYPES: DocType[] = [
  'board_memo',
  'financial_narrative',
  'investor_update',
  'sop_raci',
  'product_spec',
]

/** Need enough signal for embedding match; title + body combined. */
export const MIN_CHARS_FOR_DOC_TYPE_CLASSIFY = 48

/**
 * Rich prototype text per type so nearest-neighbor in embedding space aligns with
 * user uploads (e.g. HR meeting notes may still be closest to board memo).
 */
const DOC_TYPE_PROTOTYPES: Record<DocType, string> = {
  board_memo:
    'Board of directors memo. Quarterly board meeting minutes, governance, audit committee, CEO report to the board, fiduciary discussion, resolutions, executive session, strategic review for directors.',
  financial_narrative:
    'Financial narrative and MD&A. Management discussion and analysis, P&L commentary, revenue and margin explanation, CFO letter, financial performance story, accounting policy narrative, results discussion.',
  investor_update:
    'Investor update letter. Monthly or quarterly note to investors and VC, fundraising traction, runway and burn, KPIs, milestones, portfolio company status, capital allocation update.',
  sop_raci:
    'SOP and RACI. Standard operating procedure, runbook, roles and responsibilities matrix, who is accountable and consulted, escalation path, operational checklist, compliance steps.',
  product_spec:
    'Product specification and PRD. Product requirements, user stories, acceptance criteria, feature scope, technical design, API behavior, UX flows, engineering implementation details.',
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

function buildClassifySnippet(title: string, plainText: string, maxBodyChars: number): string {
  const t = title.trim()
  const body = plainText.trim().slice(0, maxBodyChars)
  if (t && body) return `Title: ${t}\n\n${body}`
  if (t) return `Title: ${t}`
  return body
}

/** Cache prototype embeddings per embed model (stable for process lifetime). */
const prototypeEmbeddingsCache = new Map<string, Record<DocType, number[]>>()

async function getPrototypeEmbeddings(model: string): Promise<Record<DocType, number[]>> {
  const hit = prototypeEmbeddingsCache.get(model)
  if (hit) return hit

  const vectors = await Promise.all(
    CLASSIFIABLE_DOC_TYPES.map((dt) => ollamaEmbed(DOC_TYPE_PROTOTYPES[dt], model))
  )
  const record = {} as Record<DocType, number[]>
  CLASSIFIABLE_DOC_TYPES.forEach((dt, i) => {
    record[dt] = vectors[i]
  })
  prototypeEmbeddingsCache.set(model, record)
  return record
}

export type ClassifyNearestDocTypeResult =
  | {
      ok: true
      docType: DocType
      scores: Record<DocType, number>
      snippetChars: number
    }
  | { ok: false; reason: 'insufficient_text'; snippetChars: number }

/**
 * Pick the nearest template bucket by cosine similarity between document snippet
 * and fixed prototype embeddings (same model as chunk indexing).
 */
export async function classifyNearestDocType(params: {
  title: string
  plainText: string
}): Promise<ClassifyNearestDocTypeResult> {
  const snippet = buildClassifySnippet(params.title, params.plainText, 12000)
  const snippetChars = snippet.replace(/\s+/g, ' ').trim().length
  if (snippetChars < MIN_CHARS_FOR_DOC_TYPE_CLASSIFY) {
    return { ok: false, reason: 'insufficient_text', snippetChars }
  }

  const model = getOllamaEmbedModel()
  const [docVec, prototypes] = await Promise.all([
    ollamaEmbed(snippet.slice(0, 16000), model),
    getPrototypeEmbeddings(model),
  ])

  let best: DocType = 'board_memo'
  let bestScore = -1
  const scores = {} as Record<DocType, number>
  for (const dt of CLASSIFIABLE_DOC_TYPES) {
    const s = cosineSimilarity(docVec, prototypes[dt])
    scores[dt] = s
    if (s > bestScore) {
      bestScore = s
      best = dt
    }
  }

  return { ok: true, docType: best, scores, snippetChars }
}
