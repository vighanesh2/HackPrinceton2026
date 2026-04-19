import type { ClaimKey } from '@/lib/platform/claimsSchema'
import { findSafeMatchRanges } from '@/lib/platform/conflictSafeMatch'
import { usdDisplayVariants } from '@/lib/platform/claimSurfaceStrings'

function canonicalUsdDisplay(usd: number): string {
  if (!Number.isFinite(usd) || usd < 0) return '$0'
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}k`
  return `$${Math.round(usd)}`
}

const USD_KEYS: ClaimKey[] = [
  'arr_usd',
  'mrr_usd',
  'burn_usd',
  'raise_usd',
  'valuation_usd',
]

/** Replace visible occurrences of `fromUsd` with canonical display of `toUsd`. Best-effort for demo. */
export function patchUsdAmountInHtml(html: string, fromUsd: number, toUsd: number): string {
  let out = html
  const toDisplay = canonicalUsdDisplay(toUsd)
  for (const variant of usdDisplayVariants(fromUsd)) {
    if (variant.length < 2) continue
    const ranges = findSafeMatchRanges(out, variant)
    if (!ranges.length) continue
    for (let r = ranges.length - 1; r >= 0; r -= 1) {
      const { start, end } = ranges[r]!
      out = out.slice(0, start) + toDisplay + out.slice(end)
    }
  }
  return out
}

function patchIntInHtml(html: string, from: number, to: number): string {
  if (from === to || from < 0 || to < 0) return html
  const re = new RegExp(`\\b${from}\\b`, 'g')
  return html.replace(re, String(Math.round(to)))
}

export function patchClaimInHtml(
  html: string,
  key: ClaimKey,
  fromValue: number,
  toValue: number
): string {
  if (fromValue === toValue) return html
  if (USD_KEYS.includes(key)) {
    return patchUsdAmountInHtml(html, fromValue, toValue)
  }
  if (key === 'revenue_growth_pct') {
    return patchIntInHtml(html, Math.round(fromValue), Math.round(toValue))
  }
  return patchIntInHtml(html, Math.round(fromValue), Math.round(toValue))
}

export function appendSyncFootnote(
  html: string,
  lines: { label: string; from: string; to: string }[]
): string {
  const ts = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const inner = lines
    .map((l) => `${l.label}: ${l.from} → ${l.to}`)
    .join(' · ')
  const block = `<p class="notion-sync-footnote" data-source="cross-doc-sync"><em>Synced (${inner}) — Cross-doc sync · ${ts}</em></p>`
  const trimmed = html.trim()
  if (!trimmed) return block
  return `${trimmed}${block}`
}
