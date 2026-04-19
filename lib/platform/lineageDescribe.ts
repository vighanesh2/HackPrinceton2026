import type { TeamMember } from '@/components/homeTeam'

export type FinancialLineageSnapshot = {
  cashOnHand: number
  mrr: number
  cogsPct: number
  monthlyOpex: number
  monthlyDebt: number
  monthlyRevenueGrowthPct: number
  monthlyExpenseGrowthPct: number
  newMrrPerMonth: number
  projectionMonths: number
}

const FIN_LABELS: Record<keyof FinancialLineageSnapshot, string> = {
  cashOnHand: 'Cash on hand',
  mrr: 'MRR',
  cogsPct: 'COGS %',
  monthlyOpex: 'Monthly OPEX',
  monthlyDebt: 'Monthly debt',
  monthlyRevenueGrowthPct: 'Revenue growth % / mo',
  monthlyExpenseGrowthPct: 'Expense growth % / mo',
  newMrrPerMonth: 'New MRR / mo',
  projectionMonths: 'Projection months',
}

export function describeFinancialDiff(
  prev: FinancialLineageSnapshot,
  next: FinancialLineageSnapshot,
  fmt: (n: number) => string
): string[] {
  const out: string[] = []
  ;(Object.keys(FIN_LABELS) as (keyof FinancialLineageSnapshot)[]).forEach((k) => {
    if (prev[k] !== next[k]) {
      out.push(`${FIN_LABELS[k]}: ${fmt(prev[k])} → ${fmt(next[k])}`)
    }
  })
  return out
}

export type TractionLineageSnapshot = {
  mrr: number
  customers: number
  momGrowthPct: number
  nrrPct: number
  chartMonths: number
}

const TR_LABELS: Record<keyof TractionLineageSnapshot, string> = {
  mrr: 'MRR',
  customers: 'Paying customers',
  momGrowthPct: 'MoM growth %',
  nrrPct: 'NRR %',
  chartMonths: 'Chart months',
}

export function describeTractionDiff(
  prev: TractionLineageSnapshot,
  next: TractionLineageSnapshot,
  fmtMoney: (n: number) => string
): string[] {
  const out: string[] = []
  ;(Object.keys(TR_LABELS) as (keyof TractionLineageSnapshot)[]).forEach((k) => {
    if (prev[k] !== next[k]) {
      const a = k === 'mrr' ? fmtMoney(prev[k]) : String(prev[k])
      const b = k === 'mrr' ? fmtMoney(next[k]) : String(next[k])
      out.push(`${TR_LABELS[k]}: ${a} → ${b}`)
    }
  })
  return out
}

export type MarketSizingLineageSnapshot = { tam: number; sam: number; som: number }

export function describeMarketSizingDiff(
  prev: MarketSizingLineageSnapshot,
  next: MarketSizingLineageSnapshot,
  fmt: (n: number) => string
): string[] {
  const out: string[] = []
  if (prev.tam !== next.tam) out.push(`TAM: ${fmt(prev.tam)} → ${fmt(next.tam)}`)
  if (prev.sam !== next.sam) out.push(`SAM: ${fmt(prev.sam)} → ${fmt(next.sam)}`)
  if (prev.som !== next.som) out.push(`SOM: ${fmt(prev.som)} → ${fmt(next.som)}`)
  return out
}

export function describeHtmlPlainShift(
  prevHtml: string,
  nextHtml: string,
  plainLen: (html: string) => number
): string[] {
  const a = plainLen(prevHtml)
  const b = plainLen(nextHtml)
  if (a === b && prevHtml === nextHtml) return []
  const delta = b - a
  const deltaStr = delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`
  const lines = [`Approx. readable text length: ${a} → ${b} chars (${deltaStr})`]
  if (prevHtml !== nextHtml && Math.abs(delta) <= 800 && Math.max(a, b) < 4000) {
    const p = prevHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const n = nextHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (p !== n) {
      const max = 140
      if (!p && n) lines.push(`Added text (start): “${n.slice(0, max)}${n.length > max ? '…' : ''}”`)
      else if (p && !n) lines.push('Content cleared to empty.')
      else if (n.startsWith(p)) lines.push(`Appended (excerpt): “${n.slice(p.length).trim().slice(0, max)}…”`)
      else if (p.startsWith(n)) lines.push(`Removed prefix (now starts): “${n.slice(0, max)}…”`)
    }
  }
  return lines
}

export function describeTeamRosterDiff(prev: TeamMember[], next: TeamMember[]): string[] {
  const out: string[] = []
  if (prev.length !== next.length) {
    out.push(`Roster size: ${prev.length} → ${next.length}`)
  }
  const prevNames = new Set(prev.map((m) => m.name))
  const nextNames = new Set(next.map((m) => m.name))
  for (const n of nextNames) {
    if (!prevNames.has(n)) out.push(`Added: ${n}`)
  }
  for (const p of prevNames) {
    if (!nextNames.has(p)) out.push(`Removed: ${p}`)
  }
  for (const m of next) {
    const o = prev.find((x) => x.name === m.name)
    if (!o) continue
    if (o.role !== m.role) out.push(`${m.name} — role: “${o.role}” → “${m.role}”`)
    if (o.bio !== m.bio && (o.bio.slice(0, 40) !== m.bio.slice(0, 40)))
      out.push(`${m.name} — bio updated`)
  }
  return out
}

export type BlankDocLineageSnap = { id: string; title: string; plainLen: number }

export function describeBlankDocsDiff(prev: BlankDocLineageSnap[], next: BlankDocLineageSnap[]): string[] {
  const out: string[] = []
  const pm = new Map(prev.map((d) => [d.id, d]))
  const nm = new Map(next.map((d) => [d.id, d]))
  for (const [id, n] of nm) {
    const o = pm.get(id)
    if (!o) {
      out.push(`New document: “${n.title}” (${n.plainLen} chars)`)
      continue
    }
    if (o.title !== n.title) out.push(`Renamed: “${o.title}” → “${n.title}”`)
    if (o.plainLen !== n.plainLen) {
      const d = n.plainLen - o.plainLen
      out.push(`“${n.title}” length: ${o.plainLen} → ${n.plainLen} chars (${d >= 0 ? '+' : ''}${d})`)
    }
  }
  for (const [id, o] of pm) {
    if (!nm.has(id)) out.push(`Deleted document: “${o.title}”`)
  }
  return out
}

export function describeDeckBlobChange(
  prevName: string | null,
  nextName: string | null,
  prevLen: number,
  nextLen: number
): string[] {
  const out: string[] = []
  if (prevName !== nextName) {
    out.push(`Deck file: ${prevName ?? '(none)'} → ${nextName ?? '(none)'}`)
  }
  if (prevLen !== nextLen) {
    const d = nextLen - prevLen
    out.push(`Extracted text length: ${prevLen} → ${nextLen} chars (${d >= 0 ? '+' : ''}${d})`)
  }
  return out
}
