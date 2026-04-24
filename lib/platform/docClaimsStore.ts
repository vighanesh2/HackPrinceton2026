import type { ClaimEvidenceRecord, ClaimsRecord } from '@/lib/platform/claimsSchema'

/** Per-document extracted metrics + optional evidence snippets (local or DB-backed). */
export type StoredDocClaims = {
  claims: ClaimsRecord
  evidence?: ClaimEvidenceRecord
  updatedAt: string
}

export type ClaimsStore = Record<string, StoredDocClaims | undefined>
