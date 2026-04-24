import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeMetricClaimKey } from '@/lib/platform/claimKeyNormalize'
import { extractClaimsWithSlm, type ExtractedClaimRow } from '@/lib/platform/claimExtract'
import { htmlToPlainText } from '@/lib/platform/htmlPlainText'
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

export async function runWorkspaceAnalyzeForDoc(
  supabase: SupabaseClient,
  userId: string,
  docId: string
): Promise<{ claimCount: number; issueCount: number }> {
  const { claimCount } = await extractClaimsForUserDoc(supabase, userId, docId)
  /** Cross-doc issue generation lives in `computeWorkspaceCrossDocIssues` (client) until a vetted server pipeline ships. */
  return { claimCount, issueCount: 0 }
}
