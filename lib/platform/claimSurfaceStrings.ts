import { formatClaimValue } from '@/lib/platform/claimsDisplay'
import type { ClaimKey } from '@/lib/platform/claimsSchema'

const USD_KEYS: ClaimKey[] = [
  'arr_usd',
  'mrr_usd',
  'burn_usd',
  'raise_usd',
  'valuation_usd',
]

/** Possible surface forms for a USD amount (longest first for safer matching / replace). */
export function usdDisplayVariants(usd: number): string[] {
  const s = new Set<string>()
  if (!Number.isFinite(usd) || usd < 0) return []
  const intish = Math.round(usd)
  s.add(
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(intish)
  )
  s.add(`$${intish.toLocaleString('en-US')}`)
  if (usd >= 1_000_000_000) {
    const b = usd / 1_000_000_000
    s.add(`$${b.toFixed(1)}B`)
    s.add(`$${b.toFixed(2)}B`)
    s.add(`${b.toFixed(1)}B`)
    if (Math.abs(b - Math.round(b)) < 1e-6) s.add(`$${Math.round(b)}B`)
  }
  if (usd >= 1_000_000) {
    const m = usd / 1_000_000
    s.add(`$${m.toFixed(1)}M`)
    s.add(`$${m.toFixed(2)}M`)
    s.add(`${m.toFixed(1)}M`)
    s.add(`${m.toFixed(2)}M`)
    s.add(`USD ${m.toFixed(1)}M`)
    if (Math.abs(m - Math.round(m)) < 1e-6) {
      const mi = Math.round(m)
      s.add(`$${mi}M`)
      s.add(`${mi}M`)
    }
  }
  if (usd >= 1_000 && usd < 1_000_000) {
    const k = usd / 1_000
    s.add(`$${k.toFixed(0)}k`)
    s.add(`$${k.toFixed(1)}k`)
  }
  return [...s].sort((a, b) => b.length - a.length)
}

/** Literal strings to search in document text for red conflict underlines. */
export function surfaceStringsToHighlightClaim(key: ClaimKey, value: number): string[] {
  const s = new Set<string>()
  if (!Number.isFinite(value) || value < 0) return []
  s.add(formatClaimValue(key, value))
  if (USD_KEYS.includes(key)) {
    for (const v of usdDisplayVariants(value)) s.add(v)
  }
  if (key === 'team_size' || key === 'customers' || key === 'runway_months') {
    s.add(String(Math.round(value)))
  }
  if (key === 'revenue_growth_pct') {
    const r = Math.round(value)
    s.add(`${r}%`)
    s.add(`${value}%`)
  }
  // Deck shorthand "raising 12" (no "M") still needs to ground against the bare integer.
  if (key === 'raise_usd' && value >= 1_000_000) {
    const mi = Math.round(value / 1_000_000)
    if (mi >= 1 && mi <= 999 && Math.abs(value - mi * 1_000_000) < 1) {
      s.add(String(mi))
    }
  }
  return [...s]
    .filter((x) => {
      if (x.length >= 2 || x === '0') return true
      if (
        key === 'raise_usd' &&
        /^\d{1,3}$/.test(x) &&
        Number(x) * 1_000_000 === Math.round(value)
      ) {
        return true
      }
      return false
    })
    .sort((a, b) => b.length - a.length)
}
