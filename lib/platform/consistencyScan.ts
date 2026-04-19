/**
 * Pure consistency rules over extracted claims (PLAN: metric mismatch across docs).
 */

import { normalizeMetricClaimKey } from '@/lib/platform/claimKeyNormalize'

export type ClaimRow = {
  doc_id: string
  claim_key: string
  claim_value: Record<string, unknown>
}

export type ConflictIssue = {
  claim_key: string
  summary: string
  source_doc_id: string
  target_doc_id: string
  details: Record<string, unknown>
}

function numericFromClaimValue(v: Record<string, unknown>): number | null {
  const raw = v.value
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number(raw.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function friendlyMetricName(claimKey: string): string {
  const m: Record<string, string> = {
    arr_usd: 'ARR',
    mrr_usd: 'MRR',
    monthly_burn_usd: 'Monthly burn',
    runway_months: 'Runway (months)',
    team_size: 'Team size',
    customers: 'Customers',
  }
  return m[claimKey] || claimKey.replace(/_/g, ' ')
}

function valuesConflict(a: number, b: number, claimKey: string): boolean {
  if (claimKey === 'team_size' || claimKey === 'customers' || claimKey === 'runway_months') {
    return Math.round(a) !== Math.round(b)
  }
  const max = Math.max(Math.abs(a), Math.abs(b), 1)
  return Math.abs(a - b) / max > 0.02
}

/**
 * One issue per claim_key when two different documents disagree (same key normalized).
 */
export function findMetricConflicts(claims: ClaimRow[]): ConflictIssue[] {
  const byKey = new Map<string, ClaimRow[]>()
  for (const c of claims) {
    const n = numericFromClaimValue(c.claim_value)
    if (n === null) continue
    const nk = normalizeMetricClaimKey(c.claim_key)
    const list = byKey.get(nk) ?? []
    list.push({ ...c, claim_key: nk })
    byKey.set(nk, list)
  }

  const issues: ConflictIssue[] = []
  for (const [claim_key, rows] of byKey) {
    if (rows.length < 2) continue
    outer: for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i]!
        const b = rows[j]!
        if (a.doc_id === b.doc_id) continue
        const na = numericFromClaimValue(a.claim_value)!
        const nb = numericFromClaimValue(b.claim_value)!
        if (!valuesConflict(na, nb, claim_key)) continue
        const label = friendlyMetricName(claim_key)
        issues.push({
          claim_key,
          summary: `${label} doesn’t match another doc in this workspace (${na} vs ${nb}).`,
          source_doc_id: a.doc_id,
          target_doc_id: b.doc_id,
          details: { values: [na, nb], claim_key },
        })
        break outer
      }
    }
  }
  return issues
}
