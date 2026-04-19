/**
 * Lightweight cross-doc narrative / wording checks (no LLM).
 * Pairs with metric scan — surfaces tone & phrasing tension when documents overlap in topic.
 */

export type NarrativeTension = {
  summary: string
  source_doc_id: string
  target_doc_id: string
  details: Record<string, unknown>
}

type Rule = {
  id: string
  /** Doc A must match */
  left: RegExp
  /** Doc B must match */
  right: RegExp
  summary: string
}

/** Opposing framings often seen across memo vs deck vs update. */
const RULES: Rule[] = [
  {
    id: 'rev_growth_vs_decline',
    left: /\b(revenue\s+growing|growing\s+revenue|revenue\s+growth|accelerat\w+\s+revenue)\b/i,
    right: /\b(revenue\s+declin|declining\s+revenue|revenue\s+down|shrinking\s+revenue)\b/i,
    summary: 'Revenue trend language conflicts: one doc stresses growth, another decline.',
  },
  {
    id: 'profit_vs_loss',
    left: /\b(profitable|net\s+profit|positive\s+margin)\b/i,
    right: /\b(unprofitable|net\s+loss|negative\s+margin|burning\s+cash)\b/i,
    summary: 'Profitability wording differs sharply between these documents.',
  },
  {
    id: 'beat_vs_miss',
    left: /\b(beat|exceeded|ahead\s+of)\s+(guidance|plan|forecast)\b/i,
    right: /\b(missed|below|short\s+of)\s+(guidance|plan|forecast)\b/i,
    summary: 'Guidance language is inconsistent (beat vs miss framing).',
  },
  {
    id: 'hiring_up_vs_freeze',
    left: /\b(aggressive\s+hiring|expanding\s+the\s+team|adding\s+headcount)\b/i,
    right: /\b(hiring\s+freeze|paused\s+hiring|reduc\w+\s+headcount|layoffs?)\b/i,
    summary: 'Headcount / hiring narrative conflicts across documents.',
  },
  {
    id: 'strong_vs_weak_demand',
    left: /\b(strong\s+demand|robust\s+pipeline|record\s+pipeline)\b/i,
    right: /\b(weak\s+demand|soft\s+demand|pipeline\s+concern)\b/i,
    summary: 'Demand / pipeline tone differs — align wording with metrics.',
  },
]

function wordTokens(s: string): Set<string> {
  const out = new Set<string>()
  const lower = s.toLowerCase()
  const STOP = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'as',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'this',
    'that',
    'these',
    'those',
    'with',
    'from',
    'by',
    'we',
    'our',
    'you',
    'your',
    'their',
    'its',
  ])
  for (const w of lower.split(/[^a-z0-9]+/g)) {
    if (w.length < 4) continue
    if (STOP.has(w)) continue
    out.add(w)
  }
  return out
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const x of a) {
    if (b.has(x)) inter += 1
  }
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

/**
 * When two docs share vocabulary but opposing rule halves fire, flag a soft narrative issue.
 */
export function findNarrativeTensions(
  docs: Array<{ id: string; plain: string }>
): NarrativeTension[] {
  const out: NarrativeTension[] = []
  const used = new Set<string>()

  const prepared = docs
    .map((d) => ({
      id: d.id,
      plain: d.plain,
      words: wordTokens(d.plain),
    }))
    .filter((d) => d.plain.replace(/\s+/g, ' ').trim().length >= 120)

  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const A = prepared[i]!
      const B = prepared[j]!
      const jac = jaccard(A.words, B.words)
      if (jac < 0.04) continue

      for (const rule of RULES) {
        const key = `${rule.id}:${A.id}:${B.id}`
        if (used.has(key)) continue

        const aLeft = rule.left.test(A.plain)
        const aRight = rule.right.test(A.plain)
        const bLeft = rule.left.test(B.plain)
        const bRight = rule.right.test(B.plain)
        rule.left.lastIndex = 0
        rule.right.lastIndex = 0

        if ((aLeft && bRight) || (aRight && bLeft)) {
          used.add(key)
          out.push({
            summary: rule.summary,
            source_doc_id: A.id,
            target_doc_id: B.id,
            details: { rule: rule.id, overlap: jac },
          })
          break
        }
      }
    }
  }

  /** Wording drift: high token overlap but low character similarity on first segment. */
  const driftSeen = new Set<string>()
  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const A = prepared[i]!
      const B = prepared[j]!
      const pairKey = [A.id, B.id].sort().join(':')
      if (driftSeen.has(pairKey)) continue

      const jac = jaccard(A.words, B.words)
      if (jac < 0.08) continue
      const sa = A.plain.slice(0, 600).toLowerCase()
      const sb = B.plain.slice(0, 600).toLowerCase()
      let same = 0
      const lim = Math.min(sa.length, sb.length)
      for (let k = 0; k < lim; k++) if (sa[k] === sb[k]) same++
      const ratio = lim === 0 ? 1 : same / lim
      if (jac >= 0.14 && ratio < 0.65) {
        driftSeen.add(pairKey)
        out.push({
          summary:
            'Overlapping topics but different opening emphasis — review tone and facts together across these docs.',
          source_doc_id: A.id,
          target_doc_id: B.id,
          details: { kind: 'wording_drift', overlap: jac, charSimilarity: ratio },
        })
      }
    }
  }

  return out.slice(0, 12)
}
