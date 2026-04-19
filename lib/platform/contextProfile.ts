import type { CompanyContextProfileJson } from '@/lib/platform/types'

/**
 * Merge SLM extraction delta into stored JSON profile and append narrative (capped).
 */
export function mergeCompanyProfile(
  existing: Record<string, unknown>,
  delta: CompanyContextProfileJson,
  narrativeChunk: string,
  maxNarrativeChars = 50_000
): Record<string, unknown> {
  const prevNarrative =
    typeof existing.rawNarrative === 'string' ? existing.rawNarrative : ''
  const merged: Record<string, unknown> = { ...existing }

  for (const [k, v] of Object.entries(delta)) {
    if (k === 'rawNarrative') continue
    if (v !== undefined && v !== null) {
      merged[k] = v
    }
  }

  const nextNarrative = [prevNarrative, narrativeChunk.trim()].filter(Boolean).join('\n\n')
  merged.rawNarrative = nextNarrative.slice(-maxNarrativeChars)
  merged.updatedAt = new Date().toISOString()

  return merged
}
