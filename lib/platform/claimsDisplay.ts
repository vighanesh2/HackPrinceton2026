import type { ClaimKey } from '@/lib/platform/claimsSchema'

const USD_KEYS: ClaimKey[] = [
  'arr_usd',
  'mrr_usd',
  'burn_usd',
  'raise_usd',
  'valuation_usd',
]

export function formatClaimValue(key: ClaimKey, val: number): string {
  if (key === 'team_size' || key === 'customers' || key === 'runway_months') {
    return `${Math.round(val)}`
  }
  if (key === 'revenue_growth_pct') {
    return `${val}%`
  }
  if (USD_KEYS.includes(key)) {
    if (!Number.isFinite(val) || val < 0) return '$0'
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
    if (val >= 10_000) return `$${Math.round(val / 1000)}k`
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)
  }
  return String(val)
}
