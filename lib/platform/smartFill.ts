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
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.replace(/[$,\s]/g, ''))
    if (Number.isFinite(n) && n >= 0) return n
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
    tamUsd: readUsd(raw.tamUsd ?? raw.tam),
    samUsd: readUsd(raw.samUsd ?? raw.sam),
    somUsd: readUsd(raw.somUsd ?? raw.som),
    teamMembers,
  }
}
