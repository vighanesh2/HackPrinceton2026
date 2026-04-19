import { METRIC_CLAIM_KEYS, type MetricClaimKey } from '@/lib/platform/claimExtract'

const ALIAS_TO_CANONICAL: Record<string, MetricClaimKey | string> = {
  arr: 'arr_usd',
  arr_usd: 'arr_usd',
  annual_recurring_revenue: 'arr_usd',
  annual_recurring_revenue_usd: 'arr_usd',
  recurring_revenue_arr: 'arr_usd',
  mrr: 'mrr_usd',
  mrr_usd: 'mrr_usd',
  monthly_recurring_revenue: 'mrr_usd',
  monthly_burn: 'monthly_burn_usd',
  burn: 'monthly_burn_usd',
  burn_rate: 'monthly_burn_usd',
  monthly_burn_usd: 'monthly_burn_usd',
  runway: 'runway_months',
  runway_months: 'runway_months',
  months_runway: 'runway_months',
  headcount: 'team_size',
  team_size: 'team_size',
  employees: 'team_size',
  fte: 'team_size',
  customers: 'customers',
  customer_count: 'customers',
}

const CANONICAL = new Set<string>(METRIC_CLAIM_KEYS as unknown as string[])

/**
 * Map SLM / regex labels to a single key so cross-doc comparison groups correctly.
 */
export function normalizeMetricClaimKey(raw: string): string {
  const k = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  if (!k) return 'unknown_metric'
  const mapped = ALIAS_TO_CANONICAL[k]
  if (mapped && CANONICAL.has(mapped)) return mapped
  if (CANONICAL.has(k)) return k
  if (mapped) return mapped
  return k
}
