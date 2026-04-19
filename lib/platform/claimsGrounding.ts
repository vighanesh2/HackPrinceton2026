import { surfaceStringsToHighlightClaim } from '@/lib/platform/claimSurfaceStrings'
import {
  CLAIM_KEYS,
  emptyClaimEvidenceRecord,
  type ClaimEvidenceRecord,
  type ClaimKey,
  type ClaimsRecord,
} from '@/lib/platform/claimsSchema'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Returns true if `plain` contains this display variant in a way that is unlikely
 * to be a substring of a different number (e.g. $6 inside $60M).
 */
export function variantMatchesInPlain(plain: string, variant: string): boolean {
  const p = plain
  const v = variant.trim()
  if (!v) return false

  if (v.includes('%')) {
    return p.toLowerCase().includes(v.toLowerCase())
  }

  if (v.startsWith('$')) {
    const esc = escapeRegExp(v)
    return new RegExp(`${esc}(?!\\d)`, 'i').test(p)
  }

  if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(v)) {
    const esc = escapeRegExp(v)
    return new RegExp(`(?<!\\d)${esc}(?!\\d)`, 'i').test(p)
  }

  if (v.length >= 6 || /[A-Za-z]{2}/.test(v)) {
    return p.toLowerCase().includes(v.toLowerCase())
  }

  if (/^\d/.test(v)) {
    const esc = escapeRegExp(v)
    return new RegExp(`(?<!\\d)${esc}(?!\\d)`, 'i').test(p)
  }

  return p.toLowerCase().includes(v.toLowerCase())
}

/** Drop figures that cannot be tied to literal text in the document (reduces bogus conflicts). */
export function groundedClaimsOnly(plain: string, claims: ClaimsRecord): ClaimsRecord {
  const t = plain.replace(/\s+/g, ' ').trim()
  if (!t) return claims

  const out: ClaimsRecord = { ...claims }
  for (const key of CLAIM_KEYS) {
    const v = out[key]
    if (v === null) continue
    const variants = surfaceStringsToHighlightClaim(key, v)
    const ok = variants.some((s) => variantMatchesInPlain(t, s))
    if (!ok) out[key] = null
  }
  return out
}

export function claimKeyGroundedInText(plain: string, key: ClaimKey, value: number): boolean {
  const t = plain.replace(/\s+/g, ' ').trim()
  if (!t) return false
  return surfaceStringsToHighlightClaim(key, value).some((s) => variantMatchesInPlain(t, s))
}

/** Clear evidence for any claim removed by grounding. */
export function groundedClaimsAndEvidence(
  plain: string,
  claims: ClaimsRecord,
  evidence: ClaimEvidenceRecord | undefined
): { claims: ClaimsRecord; evidence: ClaimEvidenceRecord } {
  const claimsOut = groundedClaimsOnly(plain, claims)
  const ev = evidence ? { ...evidence } : emptyClaimEvidenceRecord()
  for (const key of CLAIM_KEYS) {
    if (claimsOut[key] === null) ev[key] = null
  }
  return { claims: claimsOut, evidence: ev }
}
