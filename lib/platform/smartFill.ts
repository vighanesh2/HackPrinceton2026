import type { TeamMember } from '@/components/homeTeam'

export type SmartFillData = {
  companyDescriptionMd: string | null
  problemMd: string | null
  solutionMd: string | null
  competitiveLandscapeMd: string | null
  suggestedPageTitle: string | null
  tamUsd: number | null
  samUsd: number | null
  somUsd: number | null
  teamMembers: TeamMember[]
}

function readString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length ? t : null
}

function readUsd(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v
  if (typeof v !== 'string') return null
  let s = v.trim().replace(/\s*usd\s*$/i, '').replace(/[$,\s]/g, '')
  if (!s) return null
  const upper = s.toUpperCase().replace(/[^0-9.+\-EeKMBT]+$/g, '').trim()
  if (!upper) return null
  const m = upper.match(/^([\d.+\-Ee]+)\s*([KMBT])?$/)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n < 0) return null
  const suf = m[2]
  const mult = suf === 'K' ? 1e3 : suf === 'M' ? 1e6 : suf === 'B' ? 1e9 : suf === 'T' ? 1e12 : 1
  return n * mult
}

function readUsdField(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = raw[k]
    const n = readUsd(v)
    if (n != null) return n
  }
  return null
}

/** Pull a single JSON object from model output (handles ```json fences and leading/trailing prose). */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  let t = text.trim()
  const fence = /```(?:json)?\s*\n?([\s\S]*?)\n?```/
  const m = t.match(fence)
  if (m) t = m[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  t = t.slice(start, end + 1)
  try {
    return JSON.parse(t) as Record<string, unknown>
  } catch {
    return null
  }
}

function sliceAfterLabelUntil(
  text: string,
  label: 'TAM' | 'SAM' | 'SOM',
  stopLabel: 'TAM' | 'SAM' | 'SOM' | null,
  maxLen: number
): string {
  const re = new RegExp(`\\b${label}\\b`, 'i')
  const m = re.exec(text)
  if (!m) return ''
  let tail = text.slice(m.index + m[0].length)
  if (stopLabel) {
    const stopRe = new RegExp(`\\b${stopLabel}\\b`, 'i')
    const cut = tail.search(stopRe)
    if (cut !== -1) tail = tail.slice(0, cut)
  }
  return tail.slice(0, maxLen)
}

/**
 * Pull TAM/SAM/SOM USD figures from raw deck text (works for typical “MARKET SIZE” slides:
 * label blocks, newlines, $2.1T / $300B / $10B, etc.). Deck wins over model in merge helpers.
 */
export function inferMarketSizingFromDeckText(text: string): {
  tamUsd: number | null
  samUsd: number | null
  somUsd: number | null
} {
  const t = (text || '').replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ')
  if (!t.trim()) {
    return { tamUsd: null, samUsd: null, somUsd: null }
  }

  const parseNumSuffix = (numRaw: string, sufRaw: string | undefined): number | null => {
    const num = Number(String(numRaw).replace(/,/g, ''))
    if (!Number.isFinite(num) || num < 0) return null
    const u = (sufRaw || '').trim().toLowerCase()
    if (!u) return num
    if (u === 'k') return num * 1e3
    if (u === 'm' || u === 'mn' || u.startsWith('mil')) return num * 1e6
    if (u === 'b' || u === 'bn' || u.startsWith('bil')) return num * 1e9
    if (u === 't' || u.startsWith('tril')) return num * 1e12
    return readUsd(`${numRaw}${sufRaw}`) ?? num
  }

  const firstMoneyInSegment = (segment: string): number | null => {
    const s = segment
    if (!s.trim()) return null
    const tries: RegExp[] = [
      /(?:\$|USD\s*)?\s*([\d][\d,.]*)\s*(billion|million|trillion|bn|mn|[BMKT])\b/gi,
      /\b([\d][\d,.]*)\s*(billion|million|trillion)\b/gi,
      /(?:\$|USD\s*)?\s*([\d][\d,.]*)\s*([BMKT])\b/gi,
    ]
    for (const re of tries) {
      re.lastIndex = 0
      const m = re.exec(s)
      if (m) {
        const n = parseNumSuffix(m[1], m[2])
        if (n != null && n > 0) return n
      }
    }
    return null
  }

  /** Typical slide order: TAM block → SAM → SOM (segment = text between labels). */
  const fromSegments = (): { tamUsd: number | null; samUsd: number | null; somUsd: number | null } => {
    const tamSeg = sliceAfterLabelUntil(t, 'TAM', 'SAM', 900)
    const samSeg = sliceAfterLabelUntil(t, 'SAM', 'SOM', 900)
    const somSeg = sliceAfterLabelUntil(t, 'SOM', null, 320)
    return {
      tamUsd: firstMoneyInSegment(tamSeg),
      samUsd: firstMoneyInSegment(samSeg),
      somUsd: firstMoneyInSegment(somSeg),
    }
  }

  const tryLabelLoose = (label: 'TAM' | 'SAM' | 'SOM'): number | null => {
    const patterns: RegExp[] = [
      new RegExp(
        `\\b${label}\\b\\s*[:=\\-–—]?\\s*(?:\\$|USD\\s*)?\\s*([\\d][\\d,.]*)\\s*(billion|million|trillion|bn|mn|[BMKT])?(?!\\w)`,
        'i'
      ),
      new RegExp(
        `(?:\\$|USD\\s*)?\\s*([\\d][\\d,.]*)\\s*(billion|million|trillion|bn|mn|[BMKT])?\\s{0,120}\\b${label}\\b`,
        'i'
      ),
      new RegExp(`\\b([\\d][\\d,.]*)\\s*([BMKT])\\s{0,120}\\b${label}\\b`, 'i'),
    ]
    for (const re of patterns) {
      re.lastIndex = 0
      const m = re.exec(t)
      if (!m) continue
      const n = parseNumSuffix(m[1], m[2])
      if (n != null && n > 0) return n
    }
    return null
  }

  const seg = fromSegments()
  const tamUsd = seg.tamUsd ?? tryLabelLoose('TAM')
  const samUsd = seg.samUsd ?? tryLabelLoose('SAM')
  const somUsd = seg.somUsd ?? tryLabelLoose('SOM')
  return { tamUsd, samUsd, somUsd }
}

export function normalizeSmartFillPayload(raw: Record<string, unknown>): SmartFillData {
  const teamRaw = raw.teamMembers
  const teamMembers: TeamMember[] = []
  if (Array.isArray(teamRaw)) {
    for (const row of teamRaw.slice(0, 8)) {
      if (!row || typeof row !== 'object') continue
      const o = row as Record<string, unknown>
      const name = readString(o.name)
      const role = readString(o.role)
      const bio = readString(o.bio) || 'Add a short bio from the deck or your memory.'
      if (!name || !role) continue
      let linkedinUrl = readString(o.linkedinUrl) || 'https://www.linkedin.com/'
      if (!linkedinUrl.startsWith('http')) linkedinUrl = `https://${linkedinUrl}`
      let experience: string[] = []
      if (Array.isArray(o.experience)) {
        experience = o.experience
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map((x) => x.trim())
          .slice(0, 8)
      }
      if (experience.length === 0) {
        experience = ['Refine from deck / LinkedIn — Smart fill placeholder bullet.']
      }
      teamMembers.push({ name, role, bio, linkedinUrl, experience })
    }
  }

  return {
    companyDescriptionMd: readString(raw.companyDescriptionMd),
    problemMd: readString(raw.problemMd),
    solutionMd: readString(raw.solutionMd),
    competitiveLandscapeMd: readString(raw.competitiveLandscapeMd),
    suggestedPageTitle: readString(raw.suggestedPageTitle),
    tamUsd: readUsdField(raw, [
      'tamUsd',
      'tam',
      'TAM',
      'tam_usd',
      'totalAddressableMarket',
      'total_addressable_market',
    ]),
    samUsd: readUsdField(raw, ['samUsd', 'sam', 'SAM', 'sam_usd', 'serviceableAddressableMarket', 'serviceable_addressable_market']),
    somUsd: readUsdField(raw, ['somUsd', 'som', 'SOM', 'som_usd', 'serviceableObtainableMarket', 'serviceable_obtainable_market']),
    teamMembers,
  }
}

/** Prefer figures parsed from deck text; LLM JSON only fills gaps the deck does not spell out. */
export function mergeSmartFillWithDeckInference(
  data: SmartFillData,
  deckText: string
): SmartFillData {
  const inferred = inferMarketSizingFromDeckText(deckText)
  return {
    ...data,
    tamUsd: inferred.tamUsd != null ? inferred.tamUsd : data.tamUsd,
    samUsd: inferred.samUsd != null ? inferred.samUsd : data.samUsd,
    somUsd: inferred.somUsd != null ? inferred.somUsd : data.somUsd,
  }
}
