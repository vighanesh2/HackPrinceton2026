import { semanticSlotsAlignForConflict } from '@/lib/platform/claimSemanticSlots'
import {
  CLAIM_KEYS,
  CLAIM_TOLERANCE,
  type ClaimEvidenceRecord,
  type ClaimKey,
  type ClaimsRecord,
} from '@/lib/platform/claimsSchema'

export type StoredDocClaims = {
  claims: ClaimsRecord
  /** Short phrases around each extracted figure (used to avoid cross-metric false conflicts). */
  evidence?: ClaimEvidenceRecord
  updatedAt: string
}

export type ClaimsStore = Record<string, StoredDocClaims | undefined>

export type ClaimConflict = {
  key: ClaimKey
  docA: string
  docB: string
  valueA: number
  valueB: number
}

export type ClaimConflictDocValue = { docId: string; value: number }

/** One disagreement cluster for a metric: every aligned document that reports a figure, when values are not all the same. */
export type ClaimConflictGroup = {
  key: ClaimKey
  docs: ClaimConflictDocValue[]
}

export function claimValuesDiffer(key: ClaimKey, a: number, b: number): boolean {
  const tol = CLAIM_TOLERANCE[key]
  if (tol === 0) return a !== b
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-9)
  return Math.abs(a - b) / denom > tol
}

function ufFind(parent: number[], i: number): number {
  if (parent[i] !== i) parent[i] = ufFind(parent, parent[i]!)
  return parent[i]!
}

function ufUnion(parent: number[], i: number, j: number) {
  const ri = ufFind(parent, i)
  const rj = ufFind(parent, j)
  if (ri !== rj) parent[ri] = rj
}

type KeyDocEntry = { docId: string; value: number; evidence: string | null }

function distinctValueClasses(key: ClaimKey, values: number[]): number {
  const reps: number[] = []
  for (const val of values) {
    const same = reps.some((r) => !claimValuesDiffer(key, r, val))
    if (!same) reps.push(val)
  }
  return reps.length
}

/**
 * Groups all documents that **semantically align** on the same metric (via evidence slots),
 * then keeps clusters where at least two **numerically distinct** values appear.
 * One group per (key, connected component) — UI shows every file in that cluster together.
 */
export function detectClaimConflictGroups(store: ClaimsStore): ClaimConflictGroup[] {
  const docIds = Object.keys(store).filter((id) => store[id]?.claims)
  const out: ClaimConflictGroup[] = []

  for (const key of CLAIM_KEYS) {
    const entries: KeyDocEntry[] = []
    for (const docId of docIds) {
      const v = store[docId]!.claims[key]
      if (v === null) continue
      const ev = store[docId]?.evidence?.[key] ?? null
      entries.push({ docId, value: v, evidence: ev })
    }
    if (entries.length < 2) continue

    const n = entries.length
    const parent = Array.from({ length: n }, (_, i) => i)
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        if (semanticSlotsAlignForConflict(key, entries[i]!.evidence, entries[j]!.evidence)) {
          ufUnion(parent, i, j)
        }
      }
    }

    const byRoot = new Map<number, number[]>()
    for (let i = 0; i < n; i += 1) {
      const r = ufFind(parent, i)
      const arr = byRoot.get(r) ?? []
      arr.push(i)
      byRoot.set(r, arr)
    }

    for (const indices of byRoot.values()) {
      if (indices.length < 2) continue
      const values = indices.map((idx) => entries[idx]!.value)
      if (distinctValueClasses(key, values) < 2) continue
      const docs = indices
        .map((idx) => ({ docId: entries[idx]!.docId, value: entries[idx]!.value }))
        .sort((a, b) => a.docId.localeCompare(b.docId))
      out.push({ key, docs })
    }
  }

  out.sort((a, b) => {
    const ki = CLAIM_KEYS.indexOf(a.key) - CLAIM_KEYS.indexOf(b.key)
    if (ki !== 0) return ki
    return (a.docs[0]?.docId ?? '').localeCompare(b.docs[0]?.docId ?? '')
  })
  return out
}

/** Pairwise expansion (e.g. for legacy filters or diagnostics). */
export function detectClaimConflicts(store: ClaimsStore): ClaimConflict[] {
  const groups = detectClaimConflictGroups(store)
  const conflicts: ClaimConflict[] = []
  for (const g of groups) {
    for (let i = 0; i < g.docs.length; i += 1) {
      for (let j = i + 1; j < g.docs.length; j += 1) {
        conflicts.push({
          key: g.key,
          docA: g.docs[i]!.docId,
          docB: g.docs[j]!.docId,
          valueA: g.docs[i]!.value,
          valueB: g.docs[j]!.value,
        })
      }
    }
  }
  return conflicts
}

export function conflictCountForDoc(groups: ClaimConflictGroup[], docId: string): number {
  return groups.filter((g) => g.docs.some((d) => d.docId === docId)).length
}
