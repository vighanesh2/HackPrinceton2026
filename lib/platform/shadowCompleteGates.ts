export type ShadowPatternId =
  | 'financial'
  | 'narrative_financial'
  | 'ownership'
  | 'market'
  | 'traction_write'
  | 'product_risk'
  | 'boilerplate'

const FINANCIAL_TAIL =
  /\b(mrr|arr|gross\s+revenue|net\s+revenue|burn(\s+rate)?|runway|cac|ltv|nrr)\b\s*(is|was|at|:|=)\s*$/i

const FINANCIAL_DOLLAR = /\$\s*$/

/** Natural-language revenue/sales lines (not only "MRR is …" / TAM). */
const NARRATIVE_FINANCIAL_TAIL =
  /\b(sales|revenues?|gross\s+revenue|net\s+revenue|bookings?|top-?line|income\s+from\s+operations)\b[^.!?]{0,140}\b(for|in|during|through(?:out)?|over)\s+(this|last|the\s+current|next)\s+(year|quarter|fiscal\s+year|fy|12\s*months?)\b\s*$/i

const NARRATIVE_FINANCIAL_QUARTER =
  /\b(sales|revenues?|bookings?|gross\s+revenue|net\s+revenue)\b[^.!?]{0,100}\b(for|in)\s+(q[1-4]|h[12]|h1|h2)\b\s*$/i

const OWNERSHIP_TAIL =
  /\b(this\s+process\s+is\s+)?(owned\s+by|accountable(\s+party)?|dri|directly\s+responsible)\b\s*:?\s*$/i

/** Market / positioning lines grounded in TAM/SAM/SOM + competitive notes. */
const MARKET_TAIL =
  /\b(tam|sam|som|total\s+addressable|serviceable\s+addressable|obtainable\s+market|competitive\s+(landscape|set)|differentiat(?:e|ion|or)|positioning\s+vs)\b[^:]*:?\s*$/i

/** Traction / growth phrasing grounded in traction tab + deck. */
const TRACTION_WRITE_TAIL =
  /\b(traction|paying\s+customers|customer\s+(count|base)|logos?|pipeline|retention|expansion\s+revenue|mom\s+growth|logo\s+wall)\b[^:]*:?\s*$/i

/** Product, roadmap, GTM, risk — grounded in roadmap + deck. */
const PRODUCT_RISK_TAIL =
  /\b(roadmap|milestone|ship|release|gtm|go-?to-?market|risk|mitigation|use\s+of\s+proceeds|allocation|near-?term\s+priorit(?:y|ies))\b[^:]*:?\s*$/i

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
  if (NARRATIVE_FINANCIAL_TAIL.test(tail) || NARRATIVE_FINANCIAL_QUARTER.test(tail)) return 'narrative_financial'
  if (OWNERSHIP_TAIL.test(tail)) return 'ownership'
  if (MARKET_TAIL.test(tail)) return 'market'
  if (TRACTION_WRITE_TAIL.test(tail)) return 'traction_write'
  if (PRODUCT_RISK_TAIL.test(tail)) return 'product_risk'
  if (BOILERPLATE_TAIL.test(tail)) return 'boilerplate'
  return null
}

const ALL_PATTERNS: ShadowPatternId[] = [
  'financial',
  'narrative_financial',
  'ownership',
  'market',
  'traction_write',
  'product_risk',
  'boilerplate',
]

/** Server-side guard: pattern must match the same rules as the client. */
export function isValidShadowRequest(prefix: string, pattern: string): pattern is ShadowPatternId {
  if (!ALL_PATTERNS.includes(pattern as ShadowPatternId)) return false
  const detected = detectShadowPattern(prefix)
  return detected === pattern
}
