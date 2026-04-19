export type ShadowPatternId = 'financial' | 'ownership' | 'boilerplate'

const FINANCIAL_TAIL =
  /\b(mrr|arr|gross\s+revenue|net\s+revenue|burn(\s+rate)?|runway|cac|ltv|nrr)\b\s*(is|was|at|:|=)\s*$/i

const FINANCIAL_DOLLAR = /\$\s*$/

const OWNERSHIP_TAIL =
  /\b(this\s+process\s+is\s+)?(owned\s+by|accountable(\s+party)?|dri|directly\s+responsible)\b\s*:?\s*$/i

const BOILERPLATE_TAIL =
  /\b(kpi|definition|metric|we\s+define|in\s+this\s+(doc|document|memo))\b[^:]*:?\s*$/i

/** Last segment of the active block before the cursor (trimmed on the right). */
export function tailBeforeCursor(blockTextBeforeCursor: string, maxLen = 280): string {
  const t = blockTextBeforeCursor.replace(/\s+$/g, '')
  return t.length <= maxLen ? t : t.slice(-maxLen)
}

export function detectShadowPattern(blockTextBeforeCursor: string): ShadowPatternId | null {
  const tail = tailBeforeCursor(blockTextBeforeCursor)
  if (!tail.trim()) return null
  if (FINANCIAL_TAIL.test(tail) || FINANCIAL_DOLLAR.test(tail)) return 'financial'
  if (OWNERSHIP_TAIL.test(tail)) return 'ownership'
  if (BOILERPLATE_TAIL.test(tail)) return 'boilerplate'
  return null
}

/** Server-side guard: pattern must match the same rules as the client. */
export function isValidShadowRequest(prefix: string, pattern: string): pattern is ShadowPatternId {
  if (pattern !== 'financial' && pattern !== 'ownership' && pattern !== 'boilerplate') return false
  const detected = detectShadowPattern(prefix)
  return detected === pattern
}
