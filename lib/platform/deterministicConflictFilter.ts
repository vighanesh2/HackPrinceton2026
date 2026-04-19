import {
  claimValuesDiffer,
  type ClaimConflict,
  type ClaimConflictGroup,
  type ClaimsStore,
} from '@/lib/platform/claimsConflict'

function ratio(a: number, b: number): number {
  const hi = Math.max(a, b)
  const lo = Math.max(Math.min(a, b), 1e-9)
  return hi / lo
}

/**
 * Extra **deterministic** filters on top of `detectClaimConflictGroups` + semantic slots.
 * Same inputs always yield the same list (no LLM), so refresh is stable.
 * Drops a whole cluster only when **every** disagreeing pair inside it looks like a false positive.
 */
export function filterConflictGroupsDeterministic(
  groups: ClaimConflictGroup[],
  _store: ClaimsStore
): ClaimConflictGroup[] {
  return groups.filter((g) => {
    const { key, docs } = g
    let sawKeeperPair = false
    for (let i = 0; i < docs.length; i += 1) {
      for (let j = i + 1; j < docs.length; j += 1) {
        if (!claimValuesDiffer(key, docs[i]!.value, docs[j]!.value)) continue
        const c: ClaimConflict = {
          key,
          docA: docs[i]!.docId,
          docB: docs[j]!.docId,
          valueA: docs[i]!.value,
          valueB: docs[j]!.value,
        }
        if (!shouldDropAsLikelyFalsePositive(c)) sawKeeperPair = true
      }
    }
    return sawKeeperPair
  })
}

/**
 * @deprecated Prefer `filterConflictGroupsDeterministic` + `detectClaimConflictGroups` for UI.
 */
export function filterConflictsDeterministic(
  conflicts: ClaimConflict[],
  _store: ClaimsStore
): ClaimConflict[] {
  return conflicts.filter((c) => !shouldDropAsLikelyFalsePositive(c))
}

function shouldDropAsLikelyFalsePositive(c: ClaimConflict): boolean {
  const { key, valueA: a, valueB: b } = c
  const r = ratio(a, b)

  if (key === 'burn_usd') {
    // e.g. $28M "burn" vs $420k real monthly — huge spread + multi‑million side is rarely literal monthly burn.
    const hi = Math.max(a, b)
    if (hi >= 5_000_000 && r >= 25) return true
  }

  if (key === 'raise_usd') {
    // e.g. $185k vs $11M — different rounds / mis-tagged line items.
    const hi = Math.max(a, b)
    const lo = Math.min(a, b)
    if (r >= 45 && lo < 350_000 && hi > 4_000_000) return true
  }

  if (key === 'customers') {
    // 0 vs a real count in decks is often placeholder / definition mismatch.
    const hi = Math.max(a, b)
    if ((a === 0 || b === 0) && hi >= 25) return true
  }

  if (key === 'valuation_usd') {
    const hi = Math.max(a, b)
    if (r >= 80 && hi >= 50_000_000 && Math.min(a, b) < 5_000_000) return true
  }

  if (key === 'arr_usd' || key === 'mrr_usd') {
    const hi = Math.max(a, b)
    const lo = Math.min(a, b)
    if (r >= 200 && lo < 25_000 && hi > 3_000_000) return true
  }

  return false
}
