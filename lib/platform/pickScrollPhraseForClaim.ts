import { surfaceStringsToHighlightClaim } from '@/lib/platform/claimSurfaceStrings'
import { variantMatchesInPlain } from '@/lib/platform/claimsGrounding'
import type { ClaimKey } from '@/lib/platform/claimsSchema'

/** Longest-first surface form that actually appears in plain text (for editor scroll / search). */
export function pickScrollPhraseInPlainDoc(plain: string, key: ClaimKey, value: number): string | null {
  const t = plain.replace(/\s+/g, ' ').trim()
  if (!t) return null
  for (const v of surfaceStringsToHighlightClaim(key, value)) {
    if (v.length < 1) continue
    if (variantMatchesInPlain(t, v)) return v
  }
  return null
}
