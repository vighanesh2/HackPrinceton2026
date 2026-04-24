import { formatClaimValue } from '@/lib/platform/claimsDisplay'
import { CLAIM_LABEL, type ClaimKey } from '@/lib/platform/claimsSchema'
import type { WorkspaceCrossDocIssue } from '@/lib/platform/crossDocWorkspace'

export type CrossDocIssuePresentation = {
  /** Short label, Grammarly-style. */
  headline: string
  /** What is wrong and what to do, in plain language. */
  explanation: string
  /** Optional: where else to look (document name), not the main story. */
  contextLine?: string
  /** One line for tooltips / tight UI. */
  inlineTip: string
  /**
   * When this flag involves another workspace note, ids + titles so the UI can
   * show “Doc A ↔ Doc B” and offer Open on the peer.
   */
  docPair?: {
    currentDocId: string
    currentDocTitle: string
    otherDocId: string
    otherDocTitle: string
  }
}

function docName(id: string, docTitleById: Record<string, string>): string {
  return docTitleById[id]?.trim() || 'Untitled'
}

function truncateTip(s: string, max = 420): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

const NARRATIVE_HEADLINE: Record<string, string> = {
  rev_growth_vs_decline: 'Revenue story points two ways',
  profit_vs_loss: 'Profit vs loss wording clash',
  beat_vs_miss: 'Guidance framing disagrees',
  hiring_up_vs_freeze: 'Hiring story disagrees',
  strong_vs_weak_demand: 'Demand / pipeline tone disagrees',
}

export function formatCrossDocIssuePresentation(
  issue: WorkspaceCrossDocIssue,
  viewerDocId: string | undefined,
  docTitleById: Record<string, string>
): CrossDocIssuePresentation {
  const peerId =
    issue.sourceDocId === issue.targetDocId
      ? null
      : viewerDocId == null || viewerDocId === ''
        ? issue.targetDocId
        : issue.sourceDocId === viewerDocId
          ? issue.targetDocId
          : issue.sourceDocId

  if (issue.issueType === 'metric' && issue.details?.kind === 'arr_mrr_coherence') {
    const arr = issue.details.arrUsd as number
    const mrr = issue.details.mrrUsd as number
    const implied = issue.details.impliedArrFromMrrUsd as number
    const headline = 'ARR and MRR do not line up'
    const explanation = `This passage implies about ${formatClaimValue('arr_usd', arr)} in annual recurring revenue, but your MRR figure (${formatClaimValue('mrr_usd', mrr)}) annualizes to about ${formatClaimValue('arr_usd', implied)}. Decks often mix periods or definitions—make sure both numbers describe the same revenue basis and quarter.`
    const inlineTip = truncateTip(`${headline} — ${explanation}`)
    return { headline, explanation, inlineTip }
  }

  if (issue.issueType === 'metric') {
    const key = issue.details?.claimKey as ClaimKey | undefined
    if (!key) {
      return {
        headline: 'Number mismatch',
        explanation: issue.summary,
        inlineTip: truncateTip(issue.summary),
      }
    }
    const vs = issue.details.valueSource as number
    const vt = issue.details.valueTarget as number
    if (!viewerDocId || !peerId) {
      const label = CLAIM_LABEL[key]
      const headline = `${label} does not match across notes`
      const a = issue.sourceDocId
      const b = issue.targetDocId
      const titleA = docName(a, docTitleById)
      const titleB = docName(b, docTitleById)
      const explanation = `“${titleA}” shows ${formatClaimValue(key, vs)}; “${titleB}” shows ${formatClaimValue(key, vt)}. Open both notes in the sidebar and pick one number.`
      const inlineTip = truncateTip(`${titleA} · ${titleB} — ${headline} — ${explanation}`)
      return {
        headline,
        explanation,
        inlineTip,
        docPair: { currentDocId: a, currentDocTitle: titleA, otherDocId: b, otherDocTitle: titleB },
      }
    }
    const src = issue.sourceDocId
    const yours = viewerDocId === src ? vs : vt
    const other = viewerDocId === src ? vt : vs
    const otherDoc = viewerDocId === src ? issue.targetDocId : issue.sourceDocId
    const otherTitle = docName(otherDoc, docTitleById)
    const hereTitle = docName(viewerDocId, docTitleById)
    const label = CLAIM_LABEL[key]
    const headline = `${label} does not match another note`
    const explanation = `“${hereTitle}” (this page) says ${formatClaimValue(key, yours)}. “${otherTitle}” says ${formatClaimValue(key, other)}. Align them before you share.`
    const inlineTip = truncateTip(`${hereTitle} · ${otherTitle} — ${headline}. ${explanation}`)
    return {
      headline,
      explanation,
      inlineTip,
      docPair: {
        currentDocId: viewerDocId,
        currentDocTitle: hereTitle,
        otherDocId: otherDoc,
        otherDocTitle: otherTitle,
      },
    }
  }

  if (issue.issueType === 'narrative') {
    const a = issue.sourceDocId
    const b = issue.targetDocId
    const docPairBase =
      viewerDocId && peerId
        ? {
            currentDocId: viewerDocId,
            currentDocTitle: docName(viewerDocId, docTitleById),
            otherDocId: peerId,
            otherDocTitle: docName(peerId, docTitleById),
          }
        : {
            currentDocId: a,
            currentDocTitle: docName(a, docTitleById),
            otherDocId: b,
            otherDocTitle: docName(b, docTitleById),
          }

    if (issue.id.startsWith('narrative:wording_drift:')) {
      const headline = 'Same topic, different emphasis'
      const explanation =
        'These two notes overlap in topic but stress different angles up front. Readers may feel the story shifts between files—tighten the through-line.'
      const inlineTip = truncateTip(
        `${docPairBase.currentDocTitle} · ${docPairBase.otherDocTitle} — ${headline} — ${explanation}`
      )
      return { headline, explanation, inlineTip, docPair: docPairBase }
    }

    const rule = typeof issue.details?.rule === 'string' ? issue.details.rule : ''
    const headline = NARRATIVE_HEADLINE[rule] ?? 'Wording may confuse readers'
    const explanation =
      (issue.summary.trim() ||
        'Two documents in this workspace use language that points in opposite directions on the same theme.') +
      (viewerDocId && peerId
        ? ` This page (“${docPairBase.currentDocTitle}”) reads one way; “${docPairBase.otherDocTitle}” reads another.`
        : '')
    const inlineTip = truncateTip(
      `${docPairBase.currentDocTitle} · ${docPairBase.otherDocTitle} — ${headline} — ${explanation}`
    )
    return { headline, explanation, inlineTip, docPair: docPairBase }
  }

  return {
    headline: 'Workspace flag',
    explanation: issue.summary,
    inlineTip: truncateTip(issue.summary),
  }
}
