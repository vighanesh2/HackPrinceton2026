import {
  emptyClaimEvidenceRecord,
  emptyClaimsRecord,
  normalizeClaims,
  type ClaimEvidenceRecord,
  type ClaimsRecord,
} from '@/lib/platform/claimsSchema'

function parseMoneyToken(raw: string): number | null {
  let s = raw.trim().replace(/[$,\s]/g, '')
  if (!s) return null
  const m = s.match(/^([\d.]+)\s*([KMBkmb])?$/i)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n < 0) return null
  const suf = (m[2] || '').toUpperCase()
  const mult = suf === 'K' ? 1e3 : suf === 'M' ? 1e6 : suf === 'B' ? 1e9 : 1
  return n * mult
}

/** Bare 2010-style integers are usually years, not raise amounts. */
function tokenLooksLikeFundingUsd(raw: string, usd: number): boolean {
  const hasScale = /[KMBkmb]|\$/i.test(raw)
  if (hasScale) return true
  if (usd >= 10_000) return true
  if (usd >= 1900 && usd <= 2035) return false
  return usd > 0
}

/**
 * In pitch copy, "raising 12" / "Series A 8" almost always means millions USD, not literal dollars.
 * Skip scaling when the token already has $ or a K/M/B suffix (including "11 m" from "11 million").
 */
function raiseUsdFromFundingToken(raiseTok: string, parsedUsd: number): number {
  const tok = raiseTok.trim()
  if (!/[KMBkmb]|\$/i.test(tok)) {
    const r = Math.round(parsedUsd)
    if (r >= 1 && r <= 999 && Math.abs(parsedUsd - r) < 1e-6) {
      return r * 1_000_000
    }
  }
  return parsedUsd
}

function snippetAround(full: string, start: number, end: number, pad = 90): string {
  const a = Math.max(0, start - pad)
  const b = Math.min(full.length, end + pad)
  return full.slice(a, b).replace(/\s+/g, ' ').trim()
}

export type HeuristicExtractResult = {
  claims: ClaimsRecord
  evidence: ClaimEvidenceRecord
}

/**
 * Regex-first extraction when no LLM is configured. Intentionally conservative
 * so the demo stays credible (prefers explicit labels). Collects short evidence
 * windows for downstream grounding and future cross-doc logic.
 */
export function heuristicExtractClaimsWithEvidence(plain: string): HeuristicExtractResult {
  const t = plain.replace(/\s+/g, ' ')
  const out = emptyClaimsRecord()
  const evidence = emptyClaimEvidenceRecord()

  const arrRe = /\bARR\b[^$0-9]{0,40}(\$?\s*[\d,.]+\s*[KMBkmb]?)/gi
  let am = arrRe.exec(t)
  if (am?.[1]) {
    const n = parseMoneyToken(am[1].replace(/^\$\s*/, ''))
    if (n != null) {
      out.arr_usd = n
      evidence.arr_usd = snippetAround(t, am.index, am.index + am[0].length)
    }
  }
  if (out.arr_usd == null) {
    const arrBefore = /(\$?\s*[\d,.]+\s*[KMBkmb]?)[^A-Za-z0-9]{0,28}\bARR\b/gi
    const bm = arrBefore.exec(t)
    if (bm?.[1]) {
      const n = parseMoneyToken(bm[1].replace(/^\$\s*/, ''))
      if (n != null) {
        out.arr_usd = n
        evidence.arr_usd = snippetAround(t, bm.index, bm.index + bm[0].length)
      }
    }
  }

  const mrrRe = /\bMRR\b[^$0-9]{0,24}(\$?\s*[\d,.]+\s*[KMBkmb]?)/gi
  const mrrM = mrrRe.exec(t)
  if (mrrM?.[1]) {
    const n = parseMoneyToken(mrrM[1].replace(/^\$\s*/, ''))
    if (n != null) {
      out.mrr_usd = n
      evidence.mrr_usd = snippetAround(t, mrrM.index, mrrM.index + mrrM[0].length)
    }
  }

  const burnRe =
    /(?:monthly\s+)?burn[^$0-9]{0,48}(\$\s*[\d,.]+\s*[KMBkmb]?|[\d,.]+\s*[KMBkmb]|\d{1,3}(?:,\d{3})+(?:\.\d+)?)/gi
  const burnM = burnRe.exec(t)
  if (burnM?.[1]) {
    const n = parseMoneyToken(burnM[1].replace(/^\$\s*/, ''))
    if (n != null) {
      out.burn_usd = n
      evidence.burn_usd = snippetAround(t, burnM.index, burnM.index + burnM[0].length)
    }
  }

  const runwayRe = /runway[^0-9]{0,16}(\d+(?:\.\d+)?)\s*(?:months?|mos?)\b/gi
  const runwayM = runwayRe.exec(t)
  if (runwayM?.[1]) {
    const n = Number(runwayM[1])
    if (Number.isFinite(n) && n >= 0) {
      out.runway_months = Math.round(n)
      evidence.runway_months = snippetAround(t, runwayM.index, runwayM.index + runwayM[0].length)
    }
  }

  const raisePrimary =
    /\b(?:raised?|raising|funding|investment|seed\s+(?:round|extension)?)\D{0,52}(\$\s*[\d,.]+\s*[KMBkmb]?|[\d,.]+\s*[KMBkmb]|\d{1,3}(?:,\d{3})+)/gi
  let rm = raisePrimary.exec(t)
  let raiseTok = rm?.[1]
  let raiseIdx = rm?.index ?? -1
  let raiseLen = rm?.[0]?.length ?? 0
  if (!raiseTok) {
    const raiseSeries =
      /\bseries\s+[a-z]+\s*(?:round|financing|raise|extension)?\D{0,28}(\$\s*[\d,.]+\s*[KMBkmb]?|[\d,.]+\s*[KMBkmb]|\d{1,3}(?:,\d{3})+)/gi
    const sm = raiseSeries.exec(t)
    raiseTok = sm?.[1]
    raiseIdx = sm?.index ?? -1
    raiseLen = sm?.[0]?.length ?? 0
  }
  if (raiseTok && raiseIdx >= 0) {
    const nRaw = parseMoneyToken(raiseTok.replace(/^\$\s*/, ''))
    if (nRaw != null && tokenLooksLikeFundingUsd(raiseTok, nRaw)) {
      out.raise_usd = raiseUsdFromFundingToken(raiseTok, nRaw)
      evidence.raise_usd = snippetAround(t, raiseIdx, raiseIdx + raiseLen)
    }
  }

  const valRe = /valuation[^$0-9]{0,32}(\$?\s*[\d,.]+\s*[KMBkmb]?)/gi
  const valM = valRe.exec(t)
  if (valM?.[1]) {
    const n = parseMoneyToken(valM[1].replace(/^\$\s*/, ''))
    if (n != null) {
      out.valuation_usd = n
      evidence.valuation_usd = snippetAround(t, valM.index, valM.index + valM[0].length)
    }
  }

  const teamRe = /(?:team(?:\s+size)?|headcount|FTEs?)\D{0,12}(\d{1,4})\b/gi
  const teamM = teamRe.exec(t)
  if (teamM?.[1]) {
    const n = Number(teamM[1])
    if (Number.isFinite(n) && n >= 0 && n < 500_000) {
      out.team_size = Math.round(n)
      evidence.team_size = snippetAround(t, teamM.index, teamM.index + teamM[0].length)
    }
  }

  const custRe = /(?:customers?|accounts?|logos?)\D{0,16}(\d{1,7})\b/gi
  const custM = custRe.exec(t)
  if (custM?.[1]) {
    const n = Number(custM[1])
    if (Number.isFinite(n) && n >= 0) {
      out.customers = Math.round(n)
      evidence.customers = snippetAround(t, custM.index, custM.index + custM[0].length)
    }
  }

  const growthRe = /(?:YoY|y\/y|year[-\s]over[-\s]year)\D{0,12}(\d{1,3})\s*%/gi
  const growthM = growthRe.exec(t)
  if (growthM?.[1]) {
    const n = Number(growthM[1])
    if (Number.isFinite(n) && n >= 0 && n <= 1000) {
      out.revenue_growth_pct = n
      evidence.revenue_growth_pct = snippetAround(t, growthM.index, growthM.index + growthM[0].length)
    }
  }

  if (out.revenue_growth_pct == null) {
    const momRe =
      /(?:MoM|m\/m|month[-\s]over[-\s]month|monthly\s+growth|grown)\D{0,28}(\d{1,3})\s*%/gi
    let momM = momRe.exec(t)
    if (!momM) {
      const pctBeforeMoM = /(\d{1,3})\s*%\s*(?:MoM|m\/m|month[-\s]over[-\s]month|monthly)/gi
      momM = pctBeforeMoM.exec(t)
    }
    if (momM?.[1]) {
      const n = Number(momM[1])
      if (Number.isFinite(n) && n >= 0 && n <= 1000) {
        out.revenue_growth_pct = n
        evidence.revenue_growth_pct = snippetAround(t, momM.index, momM.index + momM[0].length)
      }
    }
  }

  return { claims: out, evidence }
}

export function heuristicExtractClaims(plain: string): ClaimsRecord {
  return heuristicExtractClaimsWithEvidence(plain).claims
}

/** Merge heuristic with partial LLM output (LLM wins on non-null fields). */
export function mergeClaimRecords(
  base: ClaimsRecord,
  overlay: Record<string, unknown>
): ClaimsRecord {
  const norm = normalizeClaims(overlay)
  const out = { ...base }
  for (const k of Object.keys(norm) as (keyof ClaimsRecord)[]) {
    if (norm[k] !== null) out[k] = norm[k]
  }
  return out
}

export function mergeClaimEvidence(
  base: ClaimEvidenceRecord,
  overlay: ClaimEvidenceRecord
): ClaimEvidenceRecord {
  const out = { ...base }
  for (const k of Object.keys(overlay) as (keyof ClaimEvidenceRecord)[]) {
    const v = overlay[k]
    if (v != null && String(v).trim()) out[k] = v
  }
  return out
}
