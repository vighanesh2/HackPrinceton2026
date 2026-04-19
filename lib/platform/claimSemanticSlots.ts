import type { ClaimKey } from '@/lib/platform/claimsSchema'

const PRE_MONEY = /\bpre[-\s]?money\b/i
const POST_MONEY = /\bpost[-\s]?money\b/i

type ValSlot = 'pre' | 'post' | 'generic' | 'unknown'

function valuationSlot(evidence: string | null | undefined): ValSlot {
  const s = (evidence ?? '').trim()
  if (!s) return 'unknown'
  if (PRE_MONEY.test(s)) return 'pre'
  if (POST_MONEY.test(s)) return 'post'
  return 'generic'
}

/** pre vs post vs generic are not the same metric; unknown pairs with anything. */
function valuationSlotsComparable(a: ValSlot, b: ValSlot): boolean {
  if (a === 'unknown' || b === 'unknown') return true
  if (a === 'pre' && b === 'post') return false
  if (a === 'post' && b === 'pre') return false
  if (a === 'pre' && b === 'generic') return false
  if (a === 'generic' && b === 'pre') return false
  if (a === 'post' && b === 'generic') return false
  if (a === 'generic' && b === 'post') return false
  return true
}

const RAISEISH =
  /\braise|\braised|\braising|\bround\b|\bfunding\b|\bseed\b|\bseries\s+[a-z]{1,3}\b|\bextension\b|\binvestment\b/i
const VALUATIONISH =
  /\bvaluation\b|\bpre[-\s]?money\b|\bpost[-\s]?money\b|\bmarket\s+cap\b|\benterprise\s+value\b|\bcap\s+table\b/i

/** Round / raise wording without dominant valuation-only phrasing. */
function raiseFundingLanguage(s: string): boolean {
  if (!s.trim()) return false
  if (RAISEISH.test(s)) return true
  return false
}

/** Snippet reads like a valuation line, not an amount-raised line. */
function valuationOnlyLanguage(s: string): boolean {
  if (!s.trim()) return false
  if (!VALUATIONISH.test(s)) return false
  if (RAISEISH.test(s)) return false
  return true
}

/**
 * When both docs report a value for `key`, returns whether a numeric mismatch should count as one metric.
 * Reduces false positives (e.g. raise vs pre-money valuation both mistaken as "Raise").
 */
export function semanticSlotsAlignForConflict(
  key: ClaimKey,
  evidenceA: string | null | undefined,
  evidenceB: string | null | undefined
): boolean {
  if (key === 'valuation_usd') {
    return valuationSlotsComparable(valuationSlot(evidenceA), valuationSlot(evidenceB))
  }

  if (key === 'raise_usd') {
    const a = (evidenceA ?? '').toLowerCase()
    const b = (evidenceB ?? '').toLowerCase()
    const aValOnly = valuationOnlyLanguage(a)
    const bValOnly = valuationOnlyLanguage(b)
    const aRaise = raiseFundingLanguage(a)
    const bRaise = raiseFundingLanguage(b)
    if ((aValOnly && bRaise) || (bValOnly && aRaise)) return false
    return true
  }

  return true
}
