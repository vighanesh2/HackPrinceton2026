import { z } from 'zod'
import { formatClaimValue } from '@/lib/platform/claimsDisplay'
import type { ClaimsStore } from '@/lib/platform/docClaimsStore'
import {
  CLAIM_KEYS,
  CLAIM_LABEL,
  CLAIM_TOLERANCE,
  type ClaimKey,
} from '@/lib/platform/claimsSchema'
import type { IssueSeverity, IssueStatus, IssueType } from '@/lib/platform/types'

/**
 * Workspace-level cross-document finding. Field names align with `consistency_issues`
 * (Supabase) so the same object can be persisted server-side later without UI churn.
 */
export type WorkspaceCrossDocIssue = {
  id: string
  severity: IssueSeverity
  issueType: IssueType
  summary: string
  sourceDocId: string
  targetDocId: string
  details: Record<string, unknown>
  status: IssueStatus
  detectedAt: string
}

const CrossDocPrefsV1Schema = z.object({
  version: z.literal(1),
  dismissedIssueIds: z.array(z.string()),
})

export type CrossDocPrefsV1 = z.infer<typeof CrossDocPrefsV1Schema>

export const CROSS_DOC_PREFS_STORAGE_KEY = 'platform_cross_doc_prefs_v1'

export const DEFAULT_CROSS_DOC_PREFS: CrossDocPrefsV1 = {
  version: 1,
  dismissedIssueIds: [],
}

export function loadCrossDocPrefs(): CrossDocPrefsV1 {
  if (typeof window === 'undefined') return DEFAULT_CROSS_DOC_PREFS
  try {
    const raw = window.localStorage.getItem(CROSS_DOC_PREFS_STORAGE_KEY)
    if (!raw) return DEFAULT_CROSS_DOC_PREFS
    const parsed = CrossDocPrefsV1Schema.safeParse(JSON.parse(raw) as unknown)
    return parsed.success ? parsed.data : DEFAULT_CROSS_DOC_PREFS
  } catch {
    return DEFAULT_CROSS_DOC_PREFS
  }
}

export function saveCrossDocPrefs(prefs: CrossDocPrefsV1): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CROSS_DOC_PREFS_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota / private mode */
  }
}

export type RecomputeCrossDocIssuesOptions = {
  dismissedIds: ReadonlySet<string>
  /** Plain text per doc for narrative checks. */
  plainTextByDocId?: Record<string, string>
  /** Titles for human-readable summaries. */
  docTitleById?: Record<string, string>
}

function sortPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

function docTitle(id: string, titles?: Record<string, string>): string {
  const t = titles?.[id]?.trim()
  return t || 'Untitled'
}

function claimValuesDiffer(key: ClaimKey, a: number, b: number): boolean {
  const tol = CLAIM_TOLERANCE[key]
  if (tol === 0) {
    if (key === 'team_size' || key === 'customers' || key === 'runway_months') {
      return Math.round(a) !== Math.round(b)
    }
    return a !== b
  }
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-9)
  return Math.abs(a - b) / denom > tol
}

const EVIDENCE_STOP = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'our',
  'are',
  'was',
  'has',
  'have',
  'year',
  'million',
  'billion',
])

/**
 * When both sides have evidence snippets, require modest token overlap so we do not
 * flag unrelated figures that landed on the same claim slot.
 */
function evidenceOverlapsEnough(evA: string | null | undefined, evB: string | null | undefined): boolean {
  if (!evA?.trim() || !evB?.trim()) return true
  const tokenize = (s: string) => {
    const set = new Set<string>()
    for (const w of s.toLowerCase().split(/\W+/)) {
      if (w.length < 3 || EVIDENCE_STOP.has(w)) continue
      set.add(w)
    }
    return set
  }
  const A = tokenize(evA)
  const B = tokenize(evB)
  if (A.size === 0 || B.size === 0) return true
  let inter = 0
  for (const t of A) {
    if (B.has(t)) inter += 1
  }
  const den = Math.min(A.size, B.size)
  return inter / den >= 0.1 || inter >= 2
}

function collectMetricIssues(
  store: ClaimsStore,
  titles: Record<string, string> | undefined,
  now: string
): WorkspaceCrossDocIssue[] {
  const docIds = Object.keys(store)
    .filter((id) => store[id]?.claims)
    .sort()
  const out: WorkspaceCrossDocIssue[] = []

  for (const key of CLAIM_KEYS) {
    for (let i = 0; i < docIds.length; i += 1) {
      for (let j = i + 1; j < docIds.length; j += 1) {
        const idA = docIds[i]!
        const idB = docIds[j]!
        const rowA = store[idA]!
        const rowB = store[idB]!
        const va = rowA.claims[key]
        const vb = rowB.claims[key]
        if (va === null || vb === null) continue
        if (!claimValuesDiffer(key, va, vb)) continue
        if (!evidenceOverlapsEnough(rowA.evidence?.[key], rowB.evidence?.[key])) continue

        const [src, tgt] = sortPair(idA, idB)
        const vSrc = store[src]!.claims[key]!
        const vTgt = store[tgt]!.claims[key]!

        out.push({
          id: `metric:${key}:${src}:${tgt}`,
          severity: 'hard',
          issueType: 'metric',
          summary: `${CLAIM_LABEL[key]}: “${docTitle(src, titles)}” has ${formatClaimValue(key, vSrc)} vs “${docTitle(tgt, titles)}” has ${formatClaimValue(key, vTgt)}.`,
          sourceDocId: src,
          targetDocId: tgt,
          details: {
            claimKey: key,
            valueSource: vSrc,
            valueTarget: vTgt,
          },
          status: 'open',
          detectedAt: now,
        })
      }
    }
  }
  return out
}

type NarrativeRule = {
  id: string
  left: RegExp
  right: RegExp
  summary: string
}

const NARRATIVE_RULES: NarrativeRule[] = [
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

function resetRuleRegexes(rule: NarrativeRule) {
  rule.left.lastIndex = 0
  rule.right.lastIndex = 0
}

function collectNarrativeIssues(
  plainById: Record<string, string> | undefined,
  titles: Record<string, string> | undefined,
  now: string
): WorkspaceCrossDocIssue[] {
  if (!plainById) return []
  const out: WorkspaceCrossDocIssue[] = []
  const usedRuleKeys = new Set<string>()

  const prepared = Object.entries(plainById)
    .map(([id, plain]) => ({
      id,
      plain,
      words: wordTokens(plain),
    }))
    .filter((d) => d.plain.replace(/\s+/g, ' ').trim().length >= 120)

  for (let i = 0; i < prepared.length; i += 1) {
    for (let j = i + 1; j < prepared.length; j += 1) {
      const A = prepared[i]!
      const B = prepared[j]!
      const jac = jaccard(A.words, B.words)
      if (jac < 0.04) continue

      for (const rule of NARRATIVE_RULES) {
        const [pairLo, pairHi] = sortPair(A.id, B.id)
        const key = `${rule.id}:${pairLo}:${pairHi}`
        if (usedRuleKeys.has(key)) continue

        resetRuleRegexes(rule)
        const aLeft = rule.left.test(A.plain)
        const aRight = rule.right.test(A.plain)
        const bLeft = rule.left.test(B.plain)
        const bRight = rule.right.test(B.plain)
        resetRuleRegexes(rule)

        if ((aLeft && bRight) || (aRight && bLeft)) {
          usedRuleKeys.add(key)
          const [src, tgt] = sortPair(A.id, B.id)
          const summary = `${rule.summary} (“${docTitle(src, titles)}” ↔ “${docTitle(tgt, titles)}”).`
          const phrasesByDocId: Record<string, string> = {}
          if (aLeft && bRight) {
            phrasesByDocId[A.id] = A.plain.match(rule.left)?.[0]?.trim() ?? ''
            phrasesByDocId[B.id] = B.plain.match(rule.right)?.[0]?.trim() ?? ''
          } else {
            phrasesByDocId[A.id] = A.plain.match(rule.right)?.[0]?.trim() ?? ''
            phrasesByDocId[B.id] = B.plain.match(rule.left)?.[0]?.trim() ?? ''
          }
          out.push({
            id: `narrative:${rule.id}:${src}:${tgt}`,
            severity: 'soft',
            issueType: 'narrative',
            summary,
            sourceDocId: src,
            targetDocId: tgt,
            details: { rule: rule.id, overlap: jac, phrasesByDocId },
            status: 'open',
            detectedAt: now,
          })
          break
        }
      }
    }
  }

  const driftSeen = new Set<string>()
  for (let i = 0; i < prepared.length; i += 1) {
    for (let j = i + 1; j < prepared.length; j += 1) {
      const A = prepared[i]!
      const B = prepared[j]!
      const [src, tgt] = sortPair(A.id, B.id)
      const pairKey = `${src}:${tgt}`
      if (driftSeen.has(pairKey)) continue

      const jac = jaccard(A.words, B.words)
      if (jac < 0.08) continue
      const sa = A.plain.slice(0, 600).toLowerCase()
      const sb = B.plain.slice(0, 600).toLowerCase()
      let same = 0
      const lim = Math.min(sa.length, sb.length)
      for (let k = 0; k < lim; k += 1) {
        if (sa[k] === sb[k]) same += 1
      }
      const ratio = lim === 0 ? 1 : same / lim
      if (jac >= 0.14 && ratio < 0.65) {
        driftSeen.add(pairKey)
        out.push({
          id: `narrative:wording_drift:${src}:${tgt}`,
          severity: 'soft',
          issueType: 'narrative',
          summary: `Overlapping topics but different opening emphasis — review “${docTitle(src, titles)}” and “${docTitle(tgt, titles)}” together.`,
          sourceDocId: src,
          targetDocId: tgt,
          details: { kind: 'wording_drift', overlap: jac, charSimilarity: ratio },
          status: 'open',
          detectedAt: now,
        })
      }
    }
  }

  return out.slice(0, 14)
}

function severityRank(s: IssueSeverity): number {
  return s === 'hard' ? 0 : 1
}

/**
 * Pure function: given per-doc claim snapshots (and optional plain text), produce cross-doc issues.
 */
export function computeWorkspaceCrossDocIssues(
  store: ClaimsStore,
  opts: RecomputeCrossDocIssuesOptions
): WorkspaceCrossDocIssue[] {
  const now = new Date().toISOString()
  const metric = collectMetricIssues(store, opts.docTitleById, now)
  const narrative = collectNarrativeIssues(opts.plainTextByDocId, opts.docTitleById, now)

  const merged = [...metric, ...narrative].filter((issue) => !opts.dismissedIds.has(issue.id))
  merged.sort((a, b) => {
    const dr = severityRank(a.severity) - severityRank(b.severity)
    if (dr !== 0) return dr
    return a.id.localeCompare(b.id)
  })
  return merged.slice(0, 40)
}
