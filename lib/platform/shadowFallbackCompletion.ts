import type { ShadowPatternId } from '@/lib/platform/shadowCompleteGates'
import { inferMarketSizingFromDeckText } from '@/lib/platform/smartFill'

function sliceSection(context: string, title: string): string {
  const marker = `=== ${title} ===`
  const i = context.indexOf(marker)
  if (i === -1) return ''
  let rest = context.slice(i + marker.length).replace(/^\s*\n/, '')
  const next = rest.search(/\n=== /)
  if (next !== -1) rest = rest.slice(0, next)
  return rest.replace(/\s+/g, ' ').trim()
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${Math.round(n / 1e3)}k`
  return `$${Math.round(n)}`
}

/**
 * When the LLM is unavailable or returns empty JSON, still offer a short,
 * workspace-grounded continuation so Shadow is visibly useful.
 */
export function buildShadowFallbackCompletion(
  pattern: ShadowPatternId,
  context: string
): { completion: string; sourceHint: string } | null {
  const deckBody = sliceSection(context, 'Pitch deck extract')
  const inferred = inferMarketSizingFromDeckText(deckBody)

  switch (pattern) {
    case 'market': {
      const sizing = sliceSection(context, 'Market sizing (workspace)')
      const parts: string[] = []
      if (sizing) parts.push(sizing)
      if (inferred.tamUsd != null) {
        parts.push(`deck text suggests TAM ≈ ${fmtUsd(inferred.tamUsd)}`)
      }
      if (inferred.samUsd != null && inferred.samUsd !== inferred.tamUsd) {
        parts.push(`SAM ≈ ${fmtUsd(inferred.samUsd)}`)
      }
      if (!parts.length) return null
      const text = parts.join(' · ')
      return {
        completion: ` — ${text}`.slice(0, 220),
        sourceHint: 'Workspace (no LLM)',
      }
    }
    case 'financial':
    case 'narrative_financial': {
      const snap = sliceSection(context, 'Derived financial snapshot (from inputs above)')
      const fin = sliceSection(context, 'Financial inputs (workspace)')
      const block = snap || fin
      if (!block) return null
      return {
        completion: ` — ${block.slice(0, 200)}${block.length > 200 ? '…' : ''}`,
        sourceHint: 'Financials (no LLM)',
      }
    }
    case 'traction_write': {
      const tr = sliceSection(context, 'Traction inputs (workspace)')
      if (!tr) return null
      return {
        completion: ` — ${tr.slice(0, 200)}${tr.length > 200 ? '…' : ''}`,
        sourceHint: 'Traction (no LLM)',
      }
    }
    case 'product_risk': {
      const pr = sliceSection(context, 'Product roadmap (plain excerpt)')
      if (!pr) return null
      return {
        completion: ` — ${pr.slice(0, 200)}${pr.length > 200 ? '…' : ''}`,
        sourceHint: 'Roadmap (no LLM)',
      }
    }
    case 'ownership': {
      const team = sliceSection(context, 'Team roster')
      if (!team) return null
      const first = team.split(/[-–]/)[0]?.trim() || team.slice(0, 80)
      return {
        completion: ` — start from roster: ${first}…`,
        sourceHint: 'Team (no LLM)',
      }
    }
    case 'boilerplate':
    default:
      return null
  }
}
