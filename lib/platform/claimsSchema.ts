export const CLAIM_KEYS = [
  'arr_usd',
  'mrr_usd',
  'burn_usd',
  'runway_months',
  'raise_usd',
  'valuation_usd',
  'team_size',
  'customers',
  'revenue_growth_pct',
] as const

export type ClaimKey = (typeof CLAIM_KEYS)[number]

export type ClaimsRecord = Record<ClaimKey, number | null>

export function emptyClaimsRecord(): ClaimsRecord {
  return {
    arr_usd: null,
    mrr_usd: null,
    burn_usd: null,
    runway_months: null,
    raise_usd: null,
    valuation_usd: null,
    team_size: null,
    customers: null,
    revenue_growth_pct: null,
  }
}

/** Short text around each figure (for semantic conflict grouping). */
export type ClaimEvidenceRecord = Record<ClaimKey, string | null>

export function emptyClaimEvidenceRecord(): ClaimEvidenceRecord {
  return {
    arr_usd: null,
    mrr_usd: null,
    burn_usd: null,
    runway_months: null,
    raise_usd: null,
    valuation_usd: null,
    team_size: null,
    customers: null,
    revenue_growth_pct: null,
  }
}

export function normalizeClaimEvidence(raw: unknown): ClaimEvidenceRecord {
  const out = emptyClaimEvidenceRecord()
  if (!raw || typeof raw !== 'object') return out
  const r = raw as Record<string, unknown>
  for (const k of CLAIM_KEYS) {
    const v = r[k]
    if (typeof v === 'string') {
      const t = v.replace(/\s+/g, ' ').trim()
      out[k] = t ? t.slice(0, 280) : null
    } else if (v === null) {
      out[k] = null
    }
  }
  return out
}

/** Relative tolerance for ratio comparison (0.02 = 2%). Int-like keys use 0 → exact match. */
export const CLAIM_TOLERANCE: Record<ClaimKey, number> = {
  arr_usd: 0.02,
  mrr_usd: 0.02,
  burn_usd: 0.02,
  runway_months: 0,
  team_size: 0,
  raise_usd: 0,
  valuation_usd: 0.05,
  customers: 0,
  revenue_growth_pct: 0.01,
}

export const CLAIM_LABEL: Record<ClaimKey, string> = {
  arr_usd: 'ARR',
  mrr_usd: 'MRR',
  burn_usd: 'Monthly burn',
  runway_months: 'Runway (months)',
  raise_usd: 'Raise',
  valuation_usd: 'Valuation',
  team_size: 'Team size',
  customers: 'Customers',
  revenue_growth_pct: 'Revenue growth %',
}

export function normalizeClaims(raw: Record<string, unknown>): ClaimsRecord {
  const out = emptyClaimsRecord()
  for (const k of CLAIM_KEYS) {
    const v = raw[k]
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      out[k] = v
    } else if (v === null) {
      out[k] = null
    }
  }
  return out
}
