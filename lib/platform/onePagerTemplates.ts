/** Stock hero image (team / collaboration) — replace anytime in the editor. */
export const ONE_PAGER_DEFAULT_HERO =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=960&q=82'

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function safeHeroSrc(url: string | null | undefined, fallback: string): string {
  const u = (url ?? '').trim()
  if (u.startsWith('https://') || u.startsWith('http://')) return u.replace(/"/g, '&quot;')
  return fallback.replace(/"/g, '&quot;')
}

/** AI output shape for the designed one-pager layout. */
export type ProjectZenAiPayload = {
  pageTitle?: string
  headline?: string
  heroImageUrl?: string | null
  whoWeAre?: string
  problem?: string
  solution?: string
  benefits?: { boldLabel?: string; detail?: string }[]
  whatsNext?: string
  ctaBold?: string
  ctaRest?: string
  footerEmail?: string
  footerPhone?: string
}

const DEFAULT_BENEFITS: { boldLabel: string; detail: string }[] = [
  { boldLabel: 'Easy to use', detail: 'Intuitive design your team can adopt quickly.' },
  { boldLabel: 'Flexible', detail: 'Customize workflows to match how you work.' },
  { boldLabel: 'Visibility', detail: 'See progress, owners, and deadlines in one place.' },
  { boldLabel: 'Risk control', detail: 'Spot blockers early before they slip the schedule.' },
]

export function buildProjectZenHtmlFromAi(payload: ProjectZenAiPayload, fallbackHero = ONE_PAGER_DEFAULT_HERO): string {
  const headline = escapeHtmlText((payload.headline || 'Your headline here').trim())
  const who = escapeHtmlText((payload.whoWeAre || 'Not stated in deck.').trim())
  const prob = escapeHtmlText((payload.problem || 'Not stated in deck.').trim())
  const sol = escapeHtmlText((payload.solution || 'Not stated in deck.').trim())
  const next = escapeHtmlText((payload.whatsNext || 'Not stated in deck.').trim())
  const ctaBold = escapeHtmlText((payload.ctaBold || 'Request a demo').trim())
  const ctaRest = escapeHtmlText((payload.ctaRest || 'to learn more about how we can help your team.').trim())
  const emailRaw = (payload.footerEmail || 'contact@company.com').trim()
  const emailDisplay = escapeHtmlText(emailRaw)
  const phoneRaw = (payload.footerPhone || 'Not stated in deck').trim()
  const phoneDisplay = escapeHtmlText(phoneRaw)
  const telClean = phoneRaw.replace(/[^\d+]/g, '')
  const phoneLink =
    telClean.replace(/\D/g, '').length >= 10
      ? `<a href="tel:${escapeHtmlAttr(telClean)}">${phoneDisplay}</a>`
      : `<span>${phoneDisplay}</span>`
  const hero = safeHeroSrc(payload.heroImageUrl, fallbackHero)

  const benefits = Array.isArray(payload.benefits) && payload.benefits.length > 0 ? payload.benefits : DEFAULT_BENEFITS
  const benefitLis = benefits.slice(0, 6).map((b) => {
    const lab = escapeHtmlText((b.boldLabel || 'Benefit').trim())
    const det = escapeHtmlText((b.detail || '').trim())
    return `<li><p><strong>${lab}:</strong> ${det}</p></li>`
  })

  return [
    '<table>',
    '<tbody>',
    '<tr>',
    `<td><img src="${hero}" alt="Team" /></td>`,
    `<td><h2>${headline}</h2></td>`,
    '</tr>',
    '</tbody>',
    '</table>',
    '<table>',
    '<tbody>',
    '<tr>',
    '<td>',
    '<h3>Who we are</h3>',
    `<p>${who}</p>`,
    '<h3>The problem</h3>',
    `<p>${prob}</p>`,
    '<h3>The solution</h3>',
    `<p>${sol}</p>`,
    '</td>',
    '<td>',
    '<h3>The benefits</h3>',
    '<ul>',
    benefitLis.join(''),
    '</ul>',
    '</td>',
    '</tr>',
    '</tbody>',
    '</table>',
    '<h3>What’s next</h3>',
    `<p>${next}</p>`,
    '<blockquote>',
    `<p><strong>${ctaBold}</strong> ${ctaRest}</p>`,
    '</blockquote>',
    '<p class="onepager-tpl-footer">',
    `<a href="mailto:${escapeHtmlAttr(emailRaw)}">${emailDisplay}</a>`,
    ' | ',
    phoneLink,
    '</p>',
  ].join('')
}

export function projectZenPageTitleFromPayload(payload: ProjectZenAiPayload, rawAnswer: string): string | null {
  const fromJson = (payload.pageTitle || '').trim()
  if (fromJson) return fromJson
  const m = rawAnswer.match(/^\s*TITLE:\s*(.+)$/im)
  if (m?.[1]) return m[1].trim()
  return null
}

function extractJsonObjectFromAnswer(raw: string): Record<string, unknown> | null {
  let t = (raw || '').trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/im
  const fm = t.match(fence)
  if (fm?.[1]) t = fm[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  t = t.slice(start, end + 1)
  try {
    const parsed = JSON.parse(t) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function parseProjectZenAiJson(raw: string): ProjectZenAiPayload | null {
  const o = extractJsonObjectFromAnswer(raw)
  return o ? (o as ProjectZenAiPayload) : null
}

/** Strategic plan layout — banner, centered title/subtitle, two columns, timeline strip. */
export type StrategicAiPayload = {
  pageTitle?: string
  bannerImageUrl?: string | null
  /** Main headline (e.g. company direction). */
  title?: string
  subtitle?: string
  missionStatement?: string
  totalBudget?: string
  /** Lines like "70% program implementation". */
  allocations?: string[]
  strategicGoals?: { title?: string; description?: string }[]
  keyMetrics?: string[]
  footerCtaText?: string
  footerLinkUrl?: string | null
  footerLinkLabel?: string
  timeline?: { year?: string; description?: string; accent?: 'red' | 'yellow' | 'blue' }[]
}

const STRATEGIC_TIMELINE_ACCENTS: Array<'red' | 'yellow' | 'blue'> = ['red', 'yellow', 'blue']

export function parseStrategicAiJson(raw: string): StrategicAiPayload | null {
  const o = extractJsonObjectFromAnswer(raw)
  return o ? (o as StrategicAiPayload) : null
}

export function strategicPageTitleFromPayload(payload: StrategicAiPayload, rawAnswer: string): string | null {
  const fromJson = (payload.pageTitle || '').trim()
  if (fromJson) return fromJson
  const fromTitle = (payload.title || '').trim()
  if (fromTitle) return fromTitle.length > 80 ? `${fromTitle.slice(0, 77)}…` : fromTitle
  const m = rawAnswer.match(/^\s*TITLE:\s*(.+)$/im)
  if (m?.[1]) return m[1].trim()
  return null
}

export function buildStrategicHtmlFromAi(
  payload: StrategicAiPayload,
  fallbackBanner = ONE_PAGER_DEFAULT_HERO
): string {
  const banner = safeHeroSrc(payload.bannerImageUrl, fallbackBanner)
  const mainTitle = escapeHtmlText((payload.title || 'Strategic direction').trim())
  const subtitle = escapeHtmlText((payload.subtitle || '— Strategic overview —').trim())
  const mission = escapeHtmlText((payload.missionStatement || 'Not stated in deck.').trim())
  const budget = escapeHtmlText((payload.totalBudget || 'Not stated in deck.').trim())

  const allocLines =
    Array.isArray(payload.allocations) && payload.allocations.length > 0
      ? payload.allocations
      : ['Not stated in deck.']
  const allocLis = allocLines.slice(0, 8).map((line) => {
    const t = escapeHtmlText(String(line || '').trim())
    return `<li><p>${t}</p></li>`
  })

  const goals =
    Array.isArray(payload.strategicGoals) && payload.strategicGoals.length > 0
      ? payload.strategicGoals
      : [{ title: 'Goal', description: 'Not stated in deck.' }]
  const goalLis = goals.slice(0, 6).map((g) => {
    const tit = escapeHtmlText((g.title || 'Goal').trim())
    const desc = escapeHtmlText((g.description || '').trim())
    return `<li><p><strong>${tit}</strong> ${desc}</p></li>`
  })

  const metrics =
    Array.isArray(payload.keyMetrics) && payload.keyMetrics.length > 0
      ? payload.keyMetrics
      : ['Not stated in deck.']
  const metricLis = metrics.slice(0, 8).map((m) => {
    const t = escapeHtmlText(String(m || '').trim())
    return `<li><p>${t}</p></li>`
  })

  const ctaBefore = escapeHtmlText(
    (payload.footerCtaText || 'Learn more about our plan or contribute to our mission at').trim()
  )
  const linkUrlRaw = (payload.footerLinkUrl || '').trim()
  const linkLabel = escapeHtmlText((payload.footerLinkLabel || 'our website').trim())
  const linkHref =
    linkUrlRaw.startsWith('https://') || linkUrlRaw.startsWith('http://')
      ? escapeHtmlAttr(linkUrlRaw)
      : 'https://example.com'
  const link = `<a href="${linkHref}" class="onepager-strategic-footer-link">${linkLabel}</a>`

  let timeline = Array.isArray(payload.timeline) ? payload.timeline.slice(0, 5) : []
  if (timeline.length === 0) {
    timeline = [
      { year: '—', description: 'Not stated in deck.', accent: 'red' },
      { year: '—', description: 'Not stated in deck.', accent: 'yellow' },
      { year: '—', description: 'Not stated in deck.', accent: 'blue' },
    ]
  }
  const timelineCells = timeline.map((item, i) => {
    const a = item.accent
    const accent =
      a === 'red' || a === 'yellow' || a === 'blue'
        ? a
        : STRATEGIC_TIMELINE_ACCENTS[i % STRATEGIC_TIMELINE_ACCENTS.length]
    const year = escapeHtmlText((item.year || '—').trim())
    const desc = escapeHtmlText((item.description || 'Not stated in deck.').trim())
    return [
      '<td class="onepager-strategic-timeline-cell">',
      `<span class="onepager-strategic-dot onepager-strategic-dot--${accent}" aria-hidden="true"></span>`,
      `<p class="onepager-strategic-year">${year}</p>`,
      `<p class="onepager-strategic-milestone">${desc}</p>`,
      '</td>',
    ].join('')
  })

  return [
    '<table class="onepager-strategic-banner-wrap"><tbody><tr><td>',
    `<img class="onepager-strategic-banner" src="${banner}" alt="" />`,
    '</td></tr></tbody></table>',
    `<h2 class="onepager-strategic-main-title">${mainTitle}</h2>`,
    `<p class="onepager-strategic-main-sub">${subtitle}</p>`,
    '<table class="onepager-strategic-columns"><tbody><tr>',
    '<td class="onepager-strategic-col onepager-strategic-col--left">',
    '<h3>Mission statement</h3>',
    `<p>${mission}</p>`,
    '<h3>Total budget</h3>',
    `<p>${budget}</p>`,
    '<h3>Allocation</h3>',
    '<ul>',
    allocLis.join(''),
    '</ul>',
    `<p class="onepager-strategic-cta">${ctaBefore} ${link}</p>`,
    '</td>',
    '<td class="onepager-strategic-col onepager-strategic-col--right">',
    '<h3>Strategic goals</h3>',
    '<ol>',
    goalLis.join(''),
    '</ol>',
    '<h3>Key metrics</h3>',
    '<ul class="onepager-strategic-metrics">',
    metricLis.join(''),
    '</ul>',
    '</td>',
    '</tr></tbody></table>',
    '<table class="onepager-strategic-timeline"><tbody><tr>',
    timelineCells,
    '</tr></tbody></table>',
  ].join('')
}

/** One-pager visual / generate modes. Default is plain rich text; others add designed layouts over time. */
export type OnePagerLayoutId = 'default' | 'general' | 'strategic' | 'ledger' | 'summit'

export type OnePagerLayoutMeta = {
  id: OnePagerLayoutId
  label: string
  description: string
  /** When false, picker shows “Soon” and the option is not selectable. */
  enabled: boolean
  /** When true, Generate uses JSON → structured HTML (designed one-pager sheet). */
  structuredGenerate: boolean
  /** TipTap wrapper class for designed surfaces; omit for default white doc. */
  editorSurfaceClass?: 'notion-rte--project-zen' | 'notion-rte--strategic'
}

export const ONE_PAGER_LAYOUTS: readonly OnePagerLayoutMeta[] = [
  {
    id: 'default',
    label: 'Normal',
    description: 'Standard rich text — Generate uses Markdown (TITLE: line + sections).',
    enabled: true,
    structuredGenerate: false,
  },
  {
    id: 'general',
    label: 'General',
    description: 'Print-style sheet (hero, two columns, CTA strip) — Generate fills layout from JSON.',
    enabled: true,
    structuredGenerate: true,
    editorSurfaceClass: 'notion-rte--project-zen',
  },
  {
    id: 'strategic',
    label: 'Strategic',
    description: 'Strategic plan layout — banner, mission and goals columns, timeline strip — JSON to HTML.',
    enabled: true,
    structuredGenerate: true,
    editorSurfaceClass: 'notion-rte--strategic',
  },
  {
    id: 'ledger',
    label: 'Ledger',
    description: 'Second designed template (coming soon).',
    enabled: false,
    structuredGenerate: true,
    editorSurfaceClass: 'notion-rte--project-zen',
  },
  {
    id: 'summit',
    label: 'Summit',
    description: 'Third designed template (coming soon).',
    enabled: false,
    structuredGenerate: true,
    editorSurfaceClass: 'notion-rte--project-zen',
  },
] as const

const LAYOUT_IDS = new Set<OnePagerLayoutId>(ONE_PAGER_LAYOUTS.map((l) => l.id))

export function parseStoredOnePagerLayoutId(raw: string | null | undefined): OnePagerLayoutId {
  const normalized = raw === 'tranquil' ? 'general' : raw
  if (normalized && LAYOUT_IDS.has(normalized as OnePagerLayoutId)) {
    const meta = ONE_PAGER_LAYOUTS.find((l) => l.id === normalized)
    if (meta?.enabled === false) return 'default'
    return normalized as OnePagerLayoutId
  }
  return 'default'
}

export function layoutMeta(id: OnePagerLayoutId): OnePagerLayoutMeta | undefined {
  return ONE_PAGER_LAYOUTS.find((l) => l.id === id)
}

export function layoutUsesStructuredGenerate(id: OnePagerLayoutId): boolean {
  const m = layoutMeta(id)
  return Boolean(m?.enabled && m.structuredGenerate)
}

export function editorSurfaceClassForLayout(id: OnePagerLayoutId): string | undefined {
  const m = layoutMeta(id)
  if (!m?.enabled || !m.editorSurfaceClass) return undefined
  return m.editorSurfaceClass
}
