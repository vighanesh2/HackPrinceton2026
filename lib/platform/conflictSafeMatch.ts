/**
 * Find start/end offsets of `fragment` in `text` only at **safe** boundaries so we do not
 * highlight `$28M` / `28M` inside `$228M`, or `$6` inside `$60`.
 */

function boundariesOkAt(text: string, frag: string, start: number): boolean {
  const end = start + frag.length
  if (end > text.length || text.slice(start, end) !== frag) return false

  /** Do not match a bare number that is actually the integer part of a percentage (e.g. raise 18M vs "18%"). */
  if (!frag.includes('%') && /^\d/.test(frag) && end < text.length && text.charAt(end) === '%') {
    return false
  }

  if (frag.startsWith('$')) {
    if (end < text.length && /\d/.test(text.charAt(end))) return false
    return true
  }

  if (frag.includes('%')) {
    if (/^\d/.test(frag)) {
      if (start > 0 && /\d/.test(text.charAt(start - 1))) return false
      if (end < text.length && /\d/.test(text.charAt(end))) return false
    }
    return true
  }

  if (frag.length >= 6 || /[A-Za-z]{2}/.test(frag)) {
    if (/^\d/.test(frag)) {
      if (start > 0 && /\d/.test(text.charAt(start - 1))) return false
      if (end < text.length && /\d/.test(text.charAt(end))) return false
    }
    return true
  }

  if (/^\d/.test(frag)) {
    if (start > 0 && /\d/.test(text.charAt(start - 1))) return false
    if (end < text.length && /\d/.test(text.charAt(end))) return false
    return true
  }

  return true
}

export function findSafeMatchRanges(text: string, fragment: string): { start: number; end: number }[] {
  const frag = fragment
  if (!frag || frag.length < 2) return []
  const out: { start: number; end: number }[] = []
  let from = 0
  while (from <= text.length - frag.length) {
    const j = text.indexOf(frag, from)
    if (j === -1) break
    if (boundariesOkAt(text, frag, j)) out.push({ start: j, end: j + frag.length })
    from = j + 1
  }
  return out
}
