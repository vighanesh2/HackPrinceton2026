import type { SupabaseClient } from '@supabase/supabase-js'

export type WorkspaceDocIssueRow = {
  id: string
  severity: string
  issue_type: string
  summary: string
}

/** Per-document rollup for IntelliJ-style icon + popover (no manual “re-scan” in UI). */
export type WorkspaceDocInsight = {
  claimCount: number
  chunkCount: number
  openIssueCount: number
  hardIssueCount: number
  /** @deprecated prefer `issues` */
  issueHints: string[]
  issues: WorkspaceDocIssueRow[]
  /** Short lines for popover: generic when thin context, specific when issues/peers exist */
  suggestions: string[]
  /** 1–2 lines: why this doc is flagged (shown first in the folder popover). */
  headlineLines: string[]
  /** Other docs tied to this one via open issues (cross-doc graph hint) */
  relatedDocs: Array<{ id: string; title: string }>
}

export type WorkspaceInsightsPayload = {
  byDocId: Record<string, WorkspaceDocInsight>
  workspaceDocCount: number
}

function buildSuggestionsForDoc(params: {
  docId: string
  ins: WorkspaceDocInsight
  titleMap: Record<string, string>
  relatedPeers: string[]
  workspaceDocCount: number
}): {
  suggestions: string[]
  headlineLines: string[]
  relatedDocs: Array<{ id: string; title: string }>
} {
  const { ins, titleMap, relatedPeers, workspaceDocCount } = params
  const relatedDocs = relatedPeers.slice(0, 4).map((id) => ({
    id,
    title: titleMap[id]?.trim() || 'Untitled',
  }))

  const headlineLines: string[] = []
  if (ins.openIssueCount > 0 && ins.issues.length > 0) {
    headlineLines.push(ins.issues[0]!.summary.slice(0, 260))
    if (ins.issues.length > 1) {
      headlineLines.push(ins.issues[1]!.summary.slice(0, 260))
    }
  }

  const suggestions: string[] = []
  const pushUnique = (s: string) => {
    const t = s.trim()
    if (t && !suggestions.includes(t)) suggestions.push(t)
  }

  if (ins.openIssueCount > 0) {
    if (relatedDocs.length > 0) {
      const names = relatedDocs.map((r) => `“${r.title}”`).join(' · ')
      pushUnique(`Also open: ${names}`)
    }
  } else {
    if (relatedDocs.length > 0) {
      const names = relatedDocs.map((r) => `“${r.title}”`).join(', ')
      pushUnique(`Tied to ${names} — compare figures and wording.`)
    }

    if (workspaceDocCount > 1 && ins.claimCount === 0 && ins.chunkCount === 0) {
      pushUnique(
        'Save body text when you’re ready — chunks and claim extract run in the background after you stop typing.'
      )
    }

    if (workspaceDocCount > 1 && ins.chunkCount > 0 && ins.claimCount === 0) {
      pushUnique(
        'Indexed for search. Claims (ARR, MRR, tone checks) run after save — edit both docs, wait a few seconds, then hover again.'
      )
    }

    if (ins.claimCount > 0 && ins.openIssueCount === 0) {
      pushUnique(
        `${ins.claimCount} metric claim(s) here — if another doc states a different number or opposite tone, a flag appears after the workspace scan.`
      )
    }

    if (suggestions.length === 0) {
      pushUnique(
        'Cross-doc checks: numbers, phrasing, and opposing tone across your workspace surface here after save.'
      )
      if (workspaceDocCount > 1) {
        pushUnique(`Workspace has ${workspaceDocCount} documents — use the folder on each to see status.`)
      } else {
        pushUnique('Add another document to compare.')
      }
    }
  }

  return {
    suggestions: suggestions.slice(0, 5),
    headlineLines: headlineLines.slice(0, 2),
    relatedDocs: relatedDocs.slice(0, 3),
  }
}

/**
 * Aggregate claims, chunks, issues; add human-readable suggestions (server-side).
 */
export async function buildWorkspaceDocInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceInsightsPayload> {
  const byDocId: Record<string, WorkspaceDocInsight> = {}

  const ensure = (docId: string): WorkspaceDocInsight => {
    if (!byDocId[docId]) {
      byDocId[docId] = {
        claimCount: 0,
        chunkCount: 0,
        openIssueCount: 0,
        hardIssueCount: 0,
        issueHints: [],
        issues: [],
        suggestions: [],
        headlineLines: [],
        relatedDocs: [],
      }
    }
    return byDocId[docId]
  }

  const { data: allDocs, error: dErr } = await supabase
    .from('documents')
    .select('id, title')
    .eq('user_id', userId)

  if (dErr) {
    throw new Error(dErr.message)
  }

  const titleMap: Record<string, string> = {}
  for (const row of allDocs || []) {
    const id = row.id as string
    titleMap[id] = typeof row.title === 'string' ? row.title : 'Untitled'
    ensure(id)
  }

  const workspaceDocCount = Object.keys(titleMap).length

  const { data: claimsRows, error: cErr } = await supabase
    .from('document_claims')
    .select('doc_id')
    .eq('user_id', userId)

  if (cErr) {
    throw new Error(cErr.message)
  }

  for (const row of claimsRows || []) {
    ensure(row.doc_id as string).claimCount += 1
  }

  const { data: chunkRows, error: chErr } = await supabase
    .from('document_chunks')
    .select('doc_id')
    .eq('user_id', userId)

  if (chErr) {
    throw new Error(chErr.message)
  }

  for (const row of chunkRows || []) {
    ensure(row.doc_id as string).chunkCount += 1
  }

  const { data: issueRows, error: iErr } = await supabase
    .from('consistency_issues')
    .select('id, severity, issue_type, summary, source_doc_id, target_doc_id, created_at')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(80)

  if (iErr) {
    throw new Error(iErr.message)
  }

  const peersByDoc: Record<string, Set<string>> = {}

  const addPeer = (docId: string, peerId: string) => {
    if (!peerId || peerId === docId) return
    if (!peersByDoc[docId]) peersByDoc[docId] = new Set()
    peersByDoc[docId]!.add(peerId)
  }

  for (const iss of issueRows || []) {
    const sev = String(iss.severity || '').toLowerCase()
    const isHard = sev === 'hard' || sev === 'critical' || sev === 'error'
    const summary = typeof iss.summary === 'string' ? iss.summary : ''
    const src = iss.source_doc_id as string | null
    const tgt = iss.target_doc_id as string | null
    const touch = [src, tgt].filter(Boolean) as string[]

    if (src && tgt) {
      addPeer(src, tgt)
      addPeer(tgt, src)
    }

    for (const docId of touch) {
      let line = summary.slice(0, 420)
      if (src && tgt) {
        const otherId = docId === src ? tgt : src
        const otherTitle = titleMap[otherId]?.trim() || 'Untitled'
        if (otherTitle && !line.includes(otherTitle)) {
          line = `${line} ↔ “${otherTitle}”.`
        }
      }
      const issueRow: WorkspaceDocIssueRow = {
        id: String(iss.id),
        severity: String(iss.severity ?? ''),
        issue_type: String(iss.issue_type ?? ''),
        summary: line.slice(0, 480),
      }

      const ins = ensure(docId)
      ins.openIssueCount += 1
      if (isHard) ins.hardIssueCount += 1
      if (line && ins.issueHints.length < 2) {
        ins.issueHints.push(line.slice(0, 160))
      }
      if (!ins.issues.some((x) => x.id === issueRow.id) && ins.issues.length < 5) {
        ins.issues.push(issueRow)
      }
    }
  }

  for (const docId of Object.keys(byDocId)) {
    const ins = byDocId[docId]!
    const relatedPeers = [...(peersByDoc[docId] || [])]
    const { suggestions, headlineLines, relatedDocs } = buildSuggestionsForDoc({
      docId,
      ins,
      titleMap,
      relatedPeers,
      workspaceDocCount,
    })
    ins.suggestions = suggestions
    ins.headlineLines = headlineLines
    ins.relatedDocs = relatedDocs
  }

  return { byDocId, workspaceDocCount }
}
