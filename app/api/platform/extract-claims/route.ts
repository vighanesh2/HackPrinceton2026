import { NextResponse } from 'next/server'
import { extractJsonObject } from '@/lib/platform/smartFill'
import {
  CLAIM_KEYS,
  emptyClaimEvidenceRecord,
  emptyClaimsRecord,
  normalizeClaimEvidence,
  type ClaimEvidenceRecord,
  type ClaimsRecord,
} from '@/lib/platform/claimsSchema'
import { groundedClaimsAndEvidence } from '@/lib/platform/claimsGrounding'
import {
  heuristicExtractClaimsWithEvidence,
  mergeClaimEvidence,
  mergeClaimRecords,
} from '@/lib/platform/heuristicExtractClaims'
import { getOllamaFastModel, ollamaChat, resolveChatModel, stripThinkingBlocks } from '@/lib/platform/ollama'

type Body = {
  text?: string
}

const CLAIMS_SCHEMA = `{
  "arr_usd": number|null,
  "mrr_usd": number|null,
  "burn_usd": number|null,
  "runway_months": number|null,
  "raise_usd": number|null,
  "valuation_usd": number|null,
  "team_size": number|null,
  "customers": number|null,
  "revenue_growth_pct": number|null
}`

const EVIDENCE_SCHEMA = `{
  "arr_usd": string|null,
  "mrr_usd": string|null,
  "burn_usd": string|null,
  "runway_months": string|null,
  "raise_usd": string|null,
  "valuation_usd": string|null,
  "team_size": string|null,
  "customers": string|null,
  "revenue_growth_pct": string|null
}`

const NESTED_SCHEMA = `{
  "claims": ${CLAIMS_SCHEMA},
  "evidence": ${EVIDENCE_SCHEMA}
}`

function coerceClaimsRecord(obj: Record<string, unknown>): ClaimsRecord {
  const out = emptyClaimsRecord()
  for (const k of CLAIM_KEYS) {
    const v = obj[k]
    if (v === null) {
      out[k] = null
      continue
    }
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      out[k] = v
    }
  }
  return out
}

function coerceExtractionPayload(obj: Record<string, unknown>): { claims: ClaimsRecord; evidence: ClaimEvidenceRecord } {
  const claimsRaw = obj.claims
  if (claimsRaw && typeof claimsRaw === 'object') {
    return {
      claims: coerceClaimsRecord(claimsRaw as Record<string, unknown>),
      evidence: normalizeClaimEvidence(obj.evidence),
    }
  }
  return {
    claims: coerceClaimsRecord(obj),
    evidence: emptyClaimEvidenceRecord(),
  }
}

const EXTRACTION_PROMPT = `Extract financial / operating figures from the text. Return ONLY valid JSON, no markdown fences.

Use this exact shape (nested object):
${NESTED_SCHEMA}

Rules for "claims":
- Money in USD base units (no K/M in numbers): $2.1M -> 2100000.
- null when not clearly stated.
- runway_months: integer months of runway.
- team_size, customers: integers.
- revenue_growth_pct: number only (e.g. 120 for 120% YoY).

CRITICAL disambiguation (avoid mixing different metrics):
- raise_usd: ONLY the size of a funding round (amount raised, round size, "raised $XM", "Series A $XM"). NOT company valuation.
- valuation_usd: company valuation, cap table valuation, "pre-money valuation", "post-money valuation", "valued at", implied valuation. Put pre-money / post-money amounts here, NOT in raise_usd.

Rules for "evidence" (same keys):
- For each non-null claim, a short phrase (8–20 words) copied or lightly trimmed from the text around that number, including labels like "pre-money valuation" or "Series A raise" so downstream logic can tell metrics apart.
- null when the claim is null.

Text:`

/**
 * Local SLM via Ollama (`LLAMA_BASE_URL`, default 127.0.0.1:11434). Document text is not sent to cloud LLMs.
 * Set `EXTRACT_CLAIMS_SKIP_LLM=1` to use regex heuristics only (no localhost call).
 */
async function extractWithOllama(plain: string): Promise<{ claims: ClaimsRecord; evidence: ClaimEvidenceRecord } | null> {
  if (process.env.EXTRACT_CLAIMS_SKIP_LLM === '1') return null

  const slice = plain.slice(0, 24_000).trim()
  if (!slice) return null

  const preferred = getOllamaFastModel()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'llama3.2'])

  const prompt = `${EXTRACTION_PROMPT}\n${slice}`

  try {
    const { content } = await ollamaChat({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    })
    const parsed = extractJsonObject(stripThinkingBlocks(content))
    if (!parsed) {
      console.warn('extract-claims Ollama: could not parse JSON from model output')
      return null
    }
    return coerceExtractionPayload(parsed as Record<string, unknown>)
  } catch (e) {
    console.warn('extract-claims Ollama error', e instanceof Error ? e.message : e)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const text = typeof body.text === 'string' ? body.text : ''
    const plain = text.replace(/\s+/g, ' ').trim()
    if (!plain) {
      return NextResponse.json({ claims: emptyClaimsRecord(), evidence: emptyClaimEvidenceRecord() })
    }

    const heur = heuristicExtractClaimsWithEvidence(plain)
    const llm = await extractWithOllama(plain)
    const mergedClaims = llm
      ? mergeClaimRecords(heur.claims, llm.claims as unknown as Record<string, unknown>)
      : heur.claims
    const mergedEvidence = llm ? mergeClaimEvidence(heur.evidence, llm.evidence) : heur.evidence
    const grounded = groundedClaimsAndEvidence(plain, mergedClaims, mergedEvidence)

    return NextResponse.json({ claims: grounded.claims, evidence: grounded.evidence })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Extract failed.' },
      { status: 500 }
    )
  }
}
