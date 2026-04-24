import { surfaceStringsToHighlightClaim } from '@/lib/platform/claimSurfaceStrings'
import type { ClaimsStore } from '@/lib/platform/docClaimsStore'
import { formatCrossDocIssuePresentation } from '@/lib/platform/formatCrossDocIssueUi'
import type { WorkspaceCrossDocIssue } from '@/lib/platform/crossDocWorkspace'
import type { ClaimKey } from '@/lib/platform/claimsSchema'

export type CrossDocEditorMark = {
  /** Literal substring to find in the document (case-sensitive match via safe matcher). */
  phrase: string
  /** Shown as native tooltip on hover. */
  title: string
}

function mergeTitlesIntoMarks(items: CrossDocEditorMark[]): CrossDocEditorMark[] {
  const byPhrase = new Map<string, Set<string>>()
  for (const { phrase, title } of items) {
    const p = phrase.trim()
    if (p.length < 2) continue
    let s = byPhrase.get(p)
    if (!s) {
      s = new Set()
      byPhrase.set(p, s)
    }
    s.add(title)
  }
  return [...byPhrase.entries()].map(([phrase, titles]) => ({
    phrase,
    title: [...titles].join(' · '),
  }))
}

/**
 * Build highlight marks for the active document from open cross-doc issues.
 */
export function buildCrossDocEditorMarks(params: {
  docId: string
  issues: WorkspaceCrossDocIssue[]
  claimsStore: ClaimsStore
  docTitleById: Record<string, string>
}): CrossDocEditorMark[] {
  const { docId, issues, claimsStore, docTitleById } = params
  const raw: CrossDocEditorMark[] = []

  for (const issue of issues) {
    if (issue.sourceDocId !== docId && issue.targetDocId !== docId) continue
    const tip = formatCrossDocIssuePresentation(issue, docId, docTitleById).inlineTip

    if (issue.issueType === 'metric') {
      if (issue.details?.kind === 'arr_mrr_coherence') {
        for (const key of ['arr_usd', 'mrr_usd'] as const) {
          const v = claimsStore[docId]?.claims[key]
          if (v === null || v === undefined || typeof v !== 'number') continue
          const phrases = surfaceStringsToHighlightClaim(key, v)
          for (const phrase of phrases) {
            if (phrase.length >= 2) raw.push({ phrase, title: tip })
          }
        }
        continue
      }
      const key = issue.details.claimKey as ClaimKey | undefined
      if (!key) continue
      const v = claimsStore[docId]?.claims[key]
      if (v === null || v === undefined || typeof v !== 'number') continue
      const phrases = surfaceStringsToHighlightClaim(key, v)
      for (const phrase of phrases) {
        if (phrase.length >= 2) raw.push({ phrase, title: tip })
      }
    } else if (issue.issueType === 'narrative') {
      const phrasesByDocId = issue.details.phrasesByDocId as Record<string, string> | undefined
      const phrase = phrasesByDocId?.[docId]?.trim()
      if (phrase && phrase.length >= 2) {
        raw.push({ phrase, title: tip })
      }
    }
  }

  return mergeTitlesIntoMarks(raw).sort((a, b) => b.phrase.length - a.phrase.length)
}
