import type { ExtractedClaimRow } from '@/lib/platform/claimExtract'

/**
 * Parse money-like tokens into USD scalar (rough, for consistency checks).
 */
function parseUsdScalar(raw: string): number | null {
  const s = raw.replace(/,/g, '').trim()
  const m = s.match(/\$?\s*([\d.]+)\s*([kKmMbB]|million|mm)?/i)
  if (!m) return null
  let n = parseFloat(m[1]!)
  if (!Number.isFinite(n)) return null
  const u = (m[2] || '').toLowerCase()
  if (u === 'k') n *= 1_000
  else if (u === 'm' || u === 'mm' || u === 'million') n *= 1_000_000
  else if (u === 'b') n *= 1_000_000_000
  return n
}

type Pattern = { claim_key: string; regex: RegExp; label: string }

/**
 * Deterministic extraction when the SLM misses obvious metric lines (tables, short edits).
 */
const PATTERNS: Pattern[] = [
  {
    claim_key: 'arr_usd',
    label: 'ARR',
    regex: /\b(?:ARR|annual\s+recurring\s+revenue)\b[^\n]{0,120}?(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million|b|B)?)/gi,
  },
  {
    claim_key: 'mrr_usd',
    label: 'MRR',
    regex: /\b(?:MRR|monthly\s+recurring\s+revenue)\b[^\n]{0,120}?(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million)?)/gi,
  },
  {
    claim_key: 'monthly_burn_usd',
    label: 'burn',
    regex: /\b(?:monthly\s+burn|burn\s+rate)\b\s*[:(]?\s*(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million)?)/gi,
  },
  {
    claim_key: 'runway_months',
    label: 'runway',
    regex: /\b(?:runway)\b\s*[:(]?\s*(\d+(?:\.\d+)?)\s*(?:months?|mos?)?/gi,
  },
  {
    claim_key: 'team_size',
    label: 'headcount',
    regex: /\b(?:headcount|team\s+size|employees|FTEs?)\b\s*[:(]?\s*(\d+)/gi,
  },
  {
    claim_key: 'customers',
    label: 'customers',
    regex: /\b(?:customers?|logos?|accounts)\b\s*[:(]?\s*(\d+)/gi,
  },
]

/**
 * Leading `$1.2M ARR` / `500k MRR` style lines.
 */
const REVERSE_PATTERNS: Pattern[] = [
  {
    claim_key: 'arr_usd',
    label: 'rev-ARR',
    regex: /(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million|b|B)?)\s*(?:USD)?\s*(?:of\s+)?(?:ARR|annual\s+recurring\s+revenue)\b/gi,
  },
  {
    claim_key: 'mrr_usd',
    label: 'rev-MRR',
    regex: /(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million)?)\s*(?:USD)?\s*(?:MRR|monthly\s+recurring\s+revenue)\b/gi,
  },
]

/**
 * Money first, label after — e.g. "$5M is our ARR", "$1M is ARR", "5m ARR".
 */
const MONEY_THEN_LABEL: Pattern[] = [
  {
    claim_key: 'arr_usd',
    label: 'money-then-ARR',
    regex: /(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million|b|B)?)[^\n]{0,140}?\b(?:ARR|annual\s+recurring\s+revenue)\b/gi,
  },
  {
    claim_key: 'mrr_usd',
    label: 'money-then-MRR',
    regex: /(\$?\s*[\d,.]+\s*(?:k|K|m|M|mm|MM|million)?)[^\n]{0,140}?\b(?:MRR|monthly\s+recurring\s+revenue)\b/gi,
  },
]

export function extractRegexMetricClaims(plain: string): ExtractedClaimRow[] {
  const text = plain.slice(0, 24_000)
  const out: ExtractedClaimRow[] = []
  const seen = new Set<string>()
  const push = (claim_key: string, token: string) => {
    const n =
      claim_key === 'runway_months'
        ? parseFloat(token.replace(/,/g, ''))
        : parseUsdScalar(token)
    if (n == null || !Number.isFinite(n)) return
    const dedupe = `${claim_key}:${n}`
    if (seen.has(dedupe)) return
    seen.add(dedupe)
    out.push({
      claim_key,
      claim_value: { value: n, unit: claim_key === 'runway_months' ? 'months' : 'usd' },
      confidence: 0.9,
    })
  }

  for (const { claim_key, regex } of PATTERNS) {
    regex.lastIndex = 0
    let m: RegExpExecArray | null
    const r = new RegExp(regex.source, regex.flags)
    while ((m = r.exec(text)) !== null) {
      if (m[1]) push(claim_key, m[1])
    }
  }
  for (const { claim_key, regex } of REVERSE_PATTERNS) {
    regex.lastIndex = 0
    let m: RegExpExecArray | null
    const r = new RegExp(regex.source, regex.flags)
    while ((m = r.exec(text)) !== null) {
      if (m[1]) push(claim_key, m[1])
    }
  }
  for (const { claim_key, regex } of MONEY_THEN_LABEL) {
    regex.lastIndex = 0
    let m: RegExpExecArray | null
    const r = new RegExp(regex.source, regex.flags)
    while ((m = r.exec(text)) !== null) {
      if (m[1]) push(claim_key, m[1])
    }
  }

  return out
}
