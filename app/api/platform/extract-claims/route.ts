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

async function extractWithAnthropic(plain: string): Promise<{ claims: ClaimsRecord; evidence: ClaimEvidenceRecord } | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key?.trim()) return null

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-20250514'

  const prompt = `Extract financial / operating figures from the text. Return ONLY valid JSON, no markdown fences.

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

Text:
${plain.slice(0, 24_000)}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    console.warn('extract-claims Anthropic error', res.status, raw.slice(0, 400))
    return null
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return null
  }

  const blocks = (payload as { content?: Array<{ type?: string; text?: string }> }).content
  const text = Array.isArray(blocks)
    ? blocks.map((b) => (b.type === 'text' && b.text ? b.text : '')).join('')
    : ''

  const parsed = extractJsonObject(text)
  if (!parsed) return null
  return coerceExtractionPayload(parsed as Record<string, unknown>)
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
    const llm = await extractWithAnthropic(plain)
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
