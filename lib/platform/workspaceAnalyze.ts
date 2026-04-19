import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeMetricClaimKey } from '@/lib/platform/claimKeyNormalize'
import { extractClaimsWithSlm, type ExtractedClaimRow } from '@/lib/platform/claimExtract'
import { findMetricConflicts, type ClaimRow } from '@/lib/platform/consistencyScan'
import { htmlToPlainText } from '@/lib/platform/htmlPlainText'
import { findNarrativeTensions } from '@/lib/platform/narrativeConsistency'
import { extractRegexMetricClaims } from '@/lib/platform/regexMetricClaims'

/**
 * Replace document_claims for one doc after SLM extraction (RLS via supabase session).
 */
export async function extractClaimsForUserDoc(
  supabase: SupabaseClient,
  userId: string,
  docId: string
): Promise<{ claimCount: number }> {
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, user_id, title, body_html')
    .eq('id', docId)
    .maybeSingle()

  if (docErr) {
    throw new Error(docErr.message)
  }
  if (!doc || doc.user_id !== userId) {
    throw new Error('Document not found.')
  }

  const title = typeof doc.title === 'string' ? doc.title.trim() : ''
  const bodyPlain = htmlToPlainText(doc.body_html || '')
  const plain = [title, bodyPlain].filter(Boolean).join('\n\n')
  let slm: Awaited<ReturnType<typeof extractClaimsWithSlm>> = []
  try {
    slm = await extractClaimsWithSlm(plain)
  } catch {
    slm = []
  }
  const regex = extractRegexMetricClaims(plain)
  const merged = new Map<string, ExtractedClaimRow>()
  for (const c of slm) {
    const k = normalizeMetricClaimKey(c.claim_key)
    merged.set(k, { ...c, claim_key: k })
  }
  for (const c of regex) {
    const k = normalizeMetricClaimKey(c.claim_key)
    merged.set(k, { ...c, claim_key: k })
  }
  const extracted = [...merged.values()]

  const { error: delErr } = await supabase.from('document_claims').delete().eq('doc_id', docId).eq('user_id', userId)
  if (delErr) {
    throw new Error(delErr.message)
  }

  if (extracted.length === 0) {
    return { claimCount: 0 }
  }

  const rows = extracted.map((c) => ({
    user_id: userId,
    doc_id: docId,
    claim_key: c.claim_key,
    claim_value: c.claim_value,
    confidence: c.confidence,
    updated_at: new Date().toISOString(),
  }))

  const { error: insErr } = await supabase.from('document_claims').insert(rows)
  if (insErr) {
    throw new Error(insErr.message)
  }

  return { claimCount: extracted.length }
}

/**
 * Rebuild open metric consistency issues from all of the user’s claims.
 */
export async function runMetricConsistencyScanForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ issueCount: number }> {
  const { data: claimsRaw, error: cErr } = await supabase
    .from('document_claims')
    .select('doc_id, claim_key, claim_value')
    .eq('user_id', userId)

  if (cErr) {
    throw new Error(cErr.message)
  }

  const claims = (claimsRaw || []) as ClaimRow[]
  const conflicts = findMetricConflicts(claims)

  const { error: delErr } = await supabase
    .from('consistency_issues')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'open')
    .eq('issue_type', 'metric')

  if (delErr) {
    throw new Error(delErr.message)
  }

  if (conflicts.length === 0) {
    return { issueCount: 0 }
  }

  const now = new Date().toISOString()
  const rows = conflicts.map((c) => ({
    user_id: userId,
    severity: 'hard',
    issue_type: 'metric',
    summary: c.summary,
    source_doc_id: c.source_doc_id,
    target_doc_id: c.target_doc_id,
    details: c.details,
    status: 'open',
    created_at: now,
  }))

  const { error: insErr } = await supabase.from('consistency_issues').insert(rows)
  if (insErr) {
    throw new Error(insErr.message)
  }

  return { issueCount: conflicts.length }
}

/**
 * Rebuild open narrative / wording issues from all workspace document bodies.
 */
export async function runNarrativeConsistencyScanForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ issueCount: number }> {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, title, body_html')
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  const prepared = (docs || []).map((d) => {
    const title = typeof d.title === 'string' ? d.title.trim() : ''
    const body = htmlToPlainText((d.body_html as string) || '')
    const plain = [title, body].filter(Boolean).join('\n\n')
    return { id: d.id as string, plain }
  })

  const tensions = findNarrativeTensions(prepared)

  const { error: delErr } = await supabase
    .from('consistency_issues')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'open')
    .eq('issue_type', 'narrative')

  if (delErr) {
    throw new Error(delErr.message)
  }

  if (tensions.length === 0) {
    return { issueCount: 0 }
  }

  const now = new Date().toISOString()
  const rows = tensions.map((t) => ({
    user_id: userId,
    severity: 'soft',
    issue_type: 'narrative',
    summary: t.summary,
    source_doc_id: t.source_doc_id,
    target_doc_id: t.target_doc_id,
    details: t.details,
    status: 'open',
    created_at: now,
  }))

  const { error: insErr } = await supabase.from('consistency_issues').insert(rows)
  if (insErr) {
    throw new Error(insErr.message)
  }

  return { issueCount: tensions.length }
}

export async function runWorkspaceAnalyzeForDoc(
  supabase: SupabaseClient,
  userId: string,
  docId: string
): Promise<{ claimCount: number; issueCount: number }> {
  const { claimCount } = await extractClaimsForUserDoc(supabase, userId, docId)
  const { issueCount: metricIssues } = await runMetricConsistencyScanForUser(supabase, userId)
  const { issueCount: narrativeIssues } = await runNarrativeConsistencyScanForUser(supabase, userId)
  return { claimCount, issueCount: metricIssues + narrativeIssues }
}
