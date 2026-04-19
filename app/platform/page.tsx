'use client'

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RichDocEditor } from '@/components/platform/RichDocEditor'
import { aiMarkdownToEditorHtml, coerceStoredEditorHtml } from '@/components/platform/editorHtml'
import {
  clearEmbeddedPitchDeckPdf,
  loadEmbeddedPitchDeckPdf,
  saveEmbeddedPitchDeckPdf,
} from '@/components/platform/pitchDeckStorage'
import {
  clearProductDemoVideo,
  clearProductScreenshots,
  loadProductDemoVideo,
  loadProductScreenshotRows,
  loadProductScreenshots,
  MAX_SCREENSHOTS,
  MAX_SHOT_BYTES,
  saveProductDemoVideo,
  saveProductScreenshots,
  type StoredScreenshotRow,
} from '@/components/platform/productStorage'
import { HOME_TEAM, type TeamMember } from '@/components/homeTeam'
import { CloudWorkspaceEditor, CloudWorkspaceSidebar } from '@/components/platform/CloudWorkspaceShell'
import { useCloudWorkspaceDocs } from '@/components/platform/useCloudWorkspaceDocs'
import { useWorkspaceInsights } from '@/components/platform/useWorkspaceInsights'
import { normalizeSmartFillPayload, type SmartFillData } from '@/lib/platform/smartFill'
import {
  clearTractionLogos,
  loadTractionLogoRows,
  loadTractionLogos,
  MAX_LOGO_BYTES,
  MAX_LOGOS,
  saveTractionLogos,
} from '@/components/platform/tractionStorage'

const STORAGE_ACTIVE_TAB_KEY = 'platform_notion_active_tab'
const STORAGE_ONE_PAGER_SUMMARY_KEY = 'platform_one_pager_summary'
const STORAGE_ONE_PAGER_VIEW_TITLE_KEY = 'platform_one_pager_view_title'
const STORAGE_ONE_PAGER_FILENAME_KEY = 'platform_one_pager_filename'
const STORAGE_ONE_PAGER_DECK_TEXT_KEY = 'platform_one_pager_deck_text'
const STORAGE_FINANCIALS_KEY = 'platform_financials_v1'
const STORAGE_PRODUCT_ROADMAP_KEY = 'platform_product_roadmap_v1'
const STORAGE_TRACTION_KEY = 'platform_traction_v1'
const STORAGE_MARKET_SIZING_KEY = 'platform_market_sizing_v1'
const STORAGE_MARKET_COMPETITIVE_KEY = 'platform_market_competitive_v1'
const STORAGE_TEAM_WORKSPACE_KEY = 'platform_team_workspace_v1'
const STORAGE_BLANK_DOCS_KEY = 'platform_blank_docs_v1'
const STORAGE_ACTIVE_BLANK_DOC_ID_KEY = 'platform_active_blank_doc_id'

const MAX_PDF_TEXT_CHARS = 24000

type TabId = 'onepager' | 'pitchdeck' | 'market' | 'product' | 'traction' | 'team' | 'financials'

type BlankWorkspaceDoc = {
  id: string
  title: string
  bodyHtml: string
}

function nextBlankWorkspaceTitle(existing: BlankWorkspaceDoc[]) {
  const base = 'Untitled'
  const names = new Set(existing.map((d) => d.title))
  if (!names.has(base)) return base
  let n = 2
  while (names.has(`${base} (${n})`)) n += 1
  return `${base} (${n})`
}

function parseBlankWorkspaceDocs(raw: string | null): BlankWorkspaceDoc[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: BlankWorkspaceDoc[] = []
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      if (!id) continue
      const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : 'Untitled'
      const bodyHtml =
        typeof r.bodyHtml === 'string' ? coerceStoredEditorHtml(r.bodyHtml) : coerceStoredEditorHtml('')
      out.push({ id, title, bodyHtml })
    }
    return out
  } catch {
    return []
  }
}

type ProductShotItem = { id: string; name: string; url: string }

type FinancialInputs = {
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

const DEFAULT_FINANCIALS: FinancialInputs = {
  cashOnHand: 250000,
  mrr: 15000,
  cogsPct: 20,
  monthlyOpex: 40000,
  monthlyDebt: 0,
  monthlyRevenueGrowthPct: 8,
  monthlyExpenseGrowthPct: 2,
  newMrrPerMonth: 3000,
  projectionMonths: 18,
}

type TractionInputs = {
  mrr: number
  customers: number
  momGrowthPct: number
  nrrPct: number
  chartMonths: number
}

const DEFAULT_TRACTION: TractionInputs = {
  mrr: 42000,
  customers: 48,
  momGrowthPct: 8,
  nrrPct: 118,
  chartMonths: 12,
}

type MarketSizing = {
  tam: number
  sam: number
  som: number
}

const DEFAULT_MARKET_SIZING: MarketSizing = {
  tam: 12_000_000_000,
  sam: 2_400_000_000,
  som: 180_000_000,
}

/** MRR points ending at `latestMrr`, implied constant MoM growth over `months` periods. */
function buildMrrSeries(latestMrr: number, momPct: number, months: number): number[] {
  const n = clamp(Math.round(months), 3, 24)
  if (!Number.isFinite(latestMrr) || latestMrr < 0) return Array.from({ length: n }, () => 0)
  const g = momPct / 100
  if (n <= 1) return [latestMrr]
  if (g === 0) return Array.from({ length: n }, () => latestMrr)
  const start = latestMrr / Math.pow(1 + g, n - 1)
  return Array.from({ length: n }, (_, i) => start * Math.pow(1 + g, i))
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function workspacePlainLen(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
}

function buildSmartFillNarrativeMd(data: SmartFillData): string {
  const parts: string[] = []
  if (data.companyDescriptionMd) parts.push('## Company', data.companyDescriptionMd, '')
  if (data.problemMd) parts.push('## Problem', data.problemMd, '')
  if (data.solutionMd) parts.push('## Solution', data.solutionMd, '')
  return parts.join('\n').trim()
}

function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '$0'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 10_000) return `$${Math.round(value / 1000)}k`
  return formatMoney(value)
}

function formatMarketMoney(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '$0'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 10_000) return `$${Math.round(value / 1000)}k`
  return formatMoney(value)
}

function TractionMrrChart({ series }: { series: number[] }) {
  const pad = { l: 58, r: 18, t: 20, b: 46 }
  const cw = 640
  const ch = 276
  const plotW = cw - pad.l - pad.r
  const plotH = ch - pad.t - pad.b
  const n = Math.max(1, series.length)
  const maxY = Math.max(...series, 1) * 1.06
  const pts = series.map((v, i) => {
    const x = pad.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
    const y = pad.t + plotH - (v / maxY) * plotH
    return { x, y, v }
  })
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const bottom = pad.t + plotH
  const firstX = pts[0]?.x ?? pad.l
  const lastX = pts[pts.length - 1]?.x ?? pad.l
  const areaD = `${lineD} L ${lastX.toFixed(1)} ${bottom.toFixed(1)} L ${firstX.toFixed(1)} ${bottom.toFixed(1)} Z`
  const yTicks = [maxY, maxY * 0.5, 0]
  const xLabelIdx = [...new Set([0, n - 1, Math.round((n - 1) / 2)])].sort((a, b) => a - b)

  return (
    <div className="notion-traction-chart-surface">
      <svg className="notion-traction-chart-svg" viewBox={`0 0 ${cw} ${ch}`} role="img" aria-label="MRR over time">
        <defs>
          <linearGradient id="tractionMrrFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tv, idx) => {
          const gy = pad.t + plotH - (tv / maxY) * plotH
          return (
            <g key={`yt-${idx}`}>
              <line x1={pad.l} y1={gy} x2={pad.l + plotW} y2={gy} className="notion-traction-chart-grid" />
              <text x={pad.l - 10} y={gy + 4} textAnchor="end" className="notion-traction-chart-axis">
                {formatCompactMoney(tv)}
              </text>
            </g>
          )
        })}
        <path d={areaD} fill="url(#tractionMrrFill)" stroke="none" />
        <path
          d={lineD}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <circle key={`pt-${i}`} cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#1d4ed8" strokeWidth="2" />
        ))}
        {xLabelIdx.map((i) => {
          const p = pts[i]
          if (!p) return null
          return (
            <text key={`xl-${i}`} x={p.x} y={ch - 14} textAnchor="middle" className="notion-traction-chart-axis">
              M{i + 1}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

/** First line `TITLE: …` is stripped and used for the page title; rest is Markdown body. */
function splitGeneratedTitleBlock(raw: string): { title: string | null; bodyMarkdown: string } {
  const trimmed = raw.trimStart()
  const firstNl = trimmed.indexOf('\n')
  const firstLine = firstNl === -1 ? trimmed : trimmed.slice(0, firstNl)
  const match = firstLine.match(/^TITLE:\s*(.+)$/i)
  if (!match) return { title: null, bodyMarkdown: raw }
  const title = match[1].trim() || null
  let rest = firstNl === -1 ? '' : trimmed.slice(firstNl + 1)
  rest = rest.replace(/^\s*\n+/, '')
  return { title, bodyMarkdown: rest }
}

function titleFromDeckFilename(name: string | null): string {
  if (!name) return 'One pager'
  const withoutExt = name.replace(/\.(pdf|pptx?)$/i, '')
  const cleaned = withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'One pager'
  return `${cleaned} — One pager`
}

async function extractPdfTextOnServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/platform/extract-pdf', {
    method: 'POST',
    body: formData,
  })

  const raw = await response.text()
  const contentType = response.headers.get('content-type') || ''
  let payload: { text?: string; error?: string } = {}
  if (contentType.includes('application/json')) {
    try {
      payload = JSON.parse(raw) as { text?: string; error?: string }
    } catch {
      throw new Error(
        'PDF extract returned invalid JSON. If this keeps happening, restart the dev server after updating dependencies.'
      )
    }
  } else if (raw.trimStart().startsWith('<')) {
    throw new Error(
      'Server returned an HTML error page instead of JSON (usually a 500 while loading the PDF library). Restart `npm run dev` after a clean build if needed.'
    )
  } else {
    throw new Error(raw.slice(0, 200) || `PDF extract failed (${response.status}).`)
  }

  if (!response.ok) {
    throw new Error(payload.error || `PDF extract failed (${response.status}).`)
  }

  return (payload.text || '').trim()
}

export default function PlatformPage() {
  const router = useRouter()
  const cloud = useCloudWorkspaceDocs(isSupabaseConfigured())
  const cloudDocsFingerprint = useMemo(
    () => cloud.documents.map((d) => `${d.id}:${d.updated_at}`).join('|'),
    [cloud.documents]
  )
  const workspaceInsights = useWorkspaceInsights(cloud.enabled, cloudDocsFingerprint)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('onepager')
  const [blankWorkspaceDocs, setBlankWorkspaceDocs] = useState<BlankWorkspaceDoc[]>([])
  const [activeBlankDocId, setActiveBlankDocId] = useState<string | null>(null)

  const [deckFileName, setDeckFileName] = useState<string | null>(null)
  const [deckText, setDeckText] = useState('')
  const [onePagerSummary, setOnePagerSummary] = useState('')
  const [onePagerViewTitle, setOnePagerViewTitle] = useState('')
  const [onePagerError, setOnePagerError] = useState<string | null>(null)
  const [isGeneratingOnePager, setIsGeneratingOnePager] = useState(false)
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const deckFileInputRef = useRef<HTMLInputElement>(null)
  const pitchDeckEmbedInputRef = useRef<HTMLInputElement>(null)
  const embeddedDeckUrlRef = useRef<string | null>(null)
  const onePagerViewTitleRef = useRef('')
  const onePagerCloudReadyRef = useRef(false)

  const [embeddedDeckUrl, setEmbeddedDeckUrl] = useState<string | null>(null)
  const [embeddedDeckName, setEmbeddedDeckName] = useState<string | null>(null)
  const [embeddedDeckError, setEmbeddedDeckError] = useState<string | null>(null)
  const [embeddedDeckBusy, setEmbeddedDeckBusy] = useState(false)
  const [isPresentingDeck, setIsPresentingDeck] = useState(false)
  const [financials, setFinancials] = useState<FinancialInputs>(DEFAULT_FINANCIALS)

  const [productRoadmap, setProductRoadmap] = useState('')
  const [productDemoUrl, setProductDemoUrl] = useState<string | null>(null)
  const [productDemoName, setProductDemoName] = useState<string | null>(null)
  const [productDemoBusy, setProductDemoBusy] = useState(false)
  const [productDemoError, setProductDemoError] = useState<string | null>(null)
  const [productShots, setProductShots] = useState<ProductShotItem[]>([])
  const [productShotsBusy, setProductShotsBusy] = useState(false)
  const [productShotsError, setProductShotsError] = useState<string | null>(null)
  const [traction, setTraction] = useState<TractionInputs>(DEFAULT_TRACTION)
  const [tractionLogos, setTractionLogos] = useState<ProductShotItem[]>([])
  const [tractionLogosBusy, setTractionLogosBusy] = useState(false)
  const [tractionLogosError, setTractionLogosError] = useState<string | null>(null)
  const [marketSizing, setMarketSizing] = useState<MarketSizing>(DEFAULT_MARKET_SIZING)
  const [marketCompetitive, setMarketCompetitive] = useState('')
  const [teamWorkspace, setTeamWorkspace] = useState<TeamMember[]>([])
  const [isSmartFilling, setIsSmartFilling] = useState(false)
  const [smartFillError, setSmartFillError] = useState<string | null>(null)
  const productDemoInputRef = useRef<HTMLInputElement>(null)
  const productShotsInputRef = useRef<HTMLInputElement>(null)
  const tractionLogoInputRef = useRef<HTMLInputElement>(null)
  const productDemoUrlRef = useRef<string | null>(null)
  const productShotsRef = useRef<ProductShotItem[]>([])
  const tractionLogosRef = useRef<ProductShotItem[]>([])

  const activeBlankDoc = useMemo(() => {
    if (!activeBlankDocId) return null
    return blankWorkspaceDocs.find((d) => d.id === activeBlankDocId) ?? null
  }, [activeBlankDocId, blankWorkspaceDocs])

  /** When a cloud doc is open, main content is the cloud editor — tab highlights should clear. */
  const workspaceTabActive = !activeBlankDocId && !(cloud.enabled && cloud.activeId)

  function goToTab(tab: TabId) {
    cloud.clearSelection()
    setActiveBlankDocId(null)
    setActiveTab(tab)
  }

  async function signOut() {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function addBlankWorkspaceDocument() {
    const id = crypto.randomUUID()
    setBlankWorkspaceDocs((prev) => {
      const title = nextBlankWorkspaceTitle(prev)
      return [{ id, title, bodyHtml: '' }, ...prev]
    })
    setActiveBlankDocId(id)
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    let cancelled = false
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setAccountEmail(data.user?.email ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const rawTab = window.localStorage.getItem(STORAGE_ACTIVE_TAB_KEY)
    const savedTab = (rawTab === 'doc' ? 'onepager' : rawTab) as TabId | null
    const savedSummary = window.localStorage.getItem(STORAGE_ONE_PAGER_SUMMARY_KEY) || ''
    const savedViewTitle = window.localStorage.getItem(STORAGE_ONE_PAGER_VIEW_TITLE_KEY) || ''
    const savedDeckName = window.localStorage.getItem(STORAGE_ONE_PAGER_FILENAME_KEY) || ''
    const savedDeckText = window.localStorage.getItem(STORAGE_ONE_PAGER_DECK_TEXT_KEY) || ''
    if (
      savedTab === 'onepager' ||
      savedTab === 'pitchdeck' ||
      savedTab === 'market' ||
      savedTab === 'product' ||
      savedTab === 'traction' ||
      savedTab === 'team' ||
      savedTab === 'financials'
    ) {
      setActiveTab(savedTab)
    }
    setOnePagerSummary(coerceStoredEditorHtml(savedSummary))
    setOnePagerViewTitle(savedViewTitle)
    setDeckFileName(savedDeckName || null)
    setDeckText(savedDeckText)
    if (savedDeckName && !savedDeckText.trim()) {
      setOnePagerError(
        'This deck was selected before, but no extracted text is saved. Choose the PDF again to extract text, or pick a PDF with selectable text (not image-only).'
      )
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_FINANCIALS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FinancialInputs>
        setFinancials({ ...DEFAULT_FINANCIALS, ...parsed })
      }
    } catch {
      setFinancials(DEFAULT_FINANCIALS)
    }
    try {
      const rawT = window.localStorage.getItem(STORAGE_TRACTION_KEY)
      if (rawT) {
        const parsed = JSON.parse(rawT) as Partial<TractionInputs>
        setTraction({ ...DEFAULT_TRACTION, ...parsed })
      }
    } catch {
      setTraction(DEFAULT_TRACTION)
    }
    try {
      const rawM = window.localStorage.getItem(STORAGE_MARKET_SIZING_KEY)
      if (rawM) {
        const parsed = JSON.parse(rawM) as Partial<MarketSizing>
        setMarketSizing({ ...DEFAULT_MARKET_SIZING, ...parsed })
      }
    } catch {
      setMarketSizing(DEFAULT_MARKET_SIZING)
    }
    setMarketCompetitive(coerceStoredEditorHtml(window.localStorage.getItem(STORAGE_MARKET_COMPETITIVE_KEY) || ''))
    try {
      const rawTw = window.localStorage.getItem(STORAGE_TEAM_WORKSPACE_KEY)
      if (rawTw) {
        const parsed = JSON.parse(rawTw) as unknown
        if (Array.isArray(parsed)) {
          const { teamMembers } = normalizeSmartFillPayload({ teamMembers: parsed })
          setTeamWorkspace(teamMembers)
        }
      }
    } catch {
      setTeamWorkspace([])
    }
    setProductRoadmap(coerceStoredEditorHtml(window.localStorage.getItem(STORAGE_PRODUCT_ROADMAP_KEY) || ''))
    const blanks = parseBlankWorkspaceDocs(window.localStorage.getItem(STORAGE_BLANK_DOCS_KEY))
    setBlankWorkspaceDocs(blanks)
    const savedActiveBlank = window.localStorage.getItem(STORAGE_ACTIVE_BLANK_DOC_ID_KEY)
    if (savedActiveBlank && blanks.some((d) => d.id === savedActiveBlank)) {
      setActiveBlankDocId(savedActiveBlank)
    }

    void (async () => {
      try {
        try {
          const row = await loadEmbeddedPitchDeckPdf()
          if (!cancelled && row) {
            setEmbeddedDeckUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev)
              return URL.createObjectURL(row.blob)
            })
            setEmbeddedDeckName(row.filename)
          }
        } catch {
          if (!cancelled) {
            setEmbeddedDeckError('Could not load a deck saved in this browser. Try uploading again.')
          }
        }

        if (!isSupabaseConfigured()) {
          return
        }

        const [onePagerRes, pitchDeckRes, marketRes] = await Promise.all([
          fetch('/api/platform/one-pager'),
          fetch('/api/platform/pitch-deck'),
          fetch('/api/platform/market'),
        ])

        if (cancelled) return

        if (onePagerRes.ok) {
          const payload = (await onePagerRes.json()) as {
            record: {
              view_title: string | null
              summary_html: string | null
              deck_filename: string | null
              deck_text: string | null
            } | null
          }
          if (!cancelled && payload.record) {
            setOnePagerViewTitle(payload.record.view_title ?? '')
            setOnePagerSummary(coerceStoredEditorHtml(payload.record.summary_html ?? ''))
            setDeckFileName(payload.record.deck_filename ?? null)
            setDeckText(payload.record.deck_text ?? '')
          }
        }

        if (pitchDeckRes.ok) {
          const pj = (await pitchDeckRes.json()) as {
            record: { filename: string; mime: string; signedUrl: string } | null
          }
          if (!cancelled && pj.record?.signedUrl) {
            const blob = await fetch(pj.record.signedUrl).then((r) => r.blob())
            if (!cancelled) {
              setEmbeddedDeckUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(blob)
              })
              setEmbeddedDeckName(pj.record.filename || 'deck.pdf')
            }
          }
        }

        if (marketRes.ok) {
          const mk = (await marketRes.json()) as {
            record: {
              sizing?: { tam?: number; sam?: number; som?: number }
              competitive_html?: string
            } | null
          }
          if (!cancelled && mk.record) {
            const s = mk.record.sizing
            if (s) {
              const tam = s.tam
              const sam = s.sam
              const som = s.som
              if (
                typeof tam === 'number' &&
                typeof sam === 'number' &&
                typeof som === 'number' &&
                [tam, sam, som].every((n) => Number.isFinite(n) && n >= 0)
              ) {
                setMarketSizing({ ...DEFAULT_MARKET_SIZING, tam, sam, som })
              }
            }
            if (typeof mk.record.competitive_html === 'string') {
              setMarketCompetitive(coerceStoredEditorHtml(mk.record.competitive_html))
            }
          }
        }
      } catch {
        // keep local / localStorage values
      } finally {
        if (!cancelled) onePagerCloudReadyRef.current = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!onePagerCloudReadyRef.current) return
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/platform/one-pager', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              viewTitle: onePagerViewTitle,
              summaryHtml: onePagerSummary,
              deckFilename: deckFileName,
              deckText,
            }),
          })
          if (!res.ok) {
            const text = await res.text()
            console.warn('One pager cloud save failed', res.status, text)
          }
        } catch (err) {
          console.warn('One pager cloud save failed', err)
        }
      })()
    }, 900)
    return () => window.clearTimeout(t)
  }, [onePagerSummary, onePagerViewTitle, deckFileName, deckText])

  useEffect(() => {
    if (!onePagerCloudReadyRef.current) return
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/platform/market', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sizing: marketSizing,
              competitiveHtml: marketCompetitive,
            }),
          })
          if (!res.ok) {
            const text = await res.text()
            console.warn('Market cloud save failed', res.status, text)
          }
        } catch (err) {
          console.warn('Market cloud save failed', err)
        }
      })()
    }, 900)
    return () => window.clearTimeout(t)
  }, [marketSizing, marketCompetitive])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_BLANK_DOCS_KEY, JSON.stringify(blankWorkspaceDocs))
  }, [blankWorkspaceDocs])

  useEffect(() => {
    if (activeBlankDocId) {
      window.localStorage.setItem(STORAGE_ACTIVE_BLANK_DOC_ID_KEY, activeBlankDocId)
    } else {
      window.localStorage.removeItem(STORAGE_ACTIVE_BLANK_DOC_ID_KEY)
    }
  }, [activeBlankDocId])

  useEffect(() => {
    if (activeBlankDocId && !blankWorkspaceDocs.some((d) => d.id === activeBlankDocId)) {
      setActiveBlankDocId(null)
    }
  }, [activeBlankDocId, blankWorkspaceDocs])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_ACTIVE_TAB_KEY, activeTab)
  }, [activeTab])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_ONE_PAGER_SUMMARY_KEY, onePagerSummary)
  }, [onePagerSummary])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_ONE_PAGER_VIEW_TITLE_KEY, onePagerViewTitle)
  }, [onePagerViewTitle])

  useEffect(() => {
    onePagerViewTitleRef.current = onePagerViewTitle
  }, [onePagerViewTitle])

  useEffect(() => {
    embeddedDeckUrlRef.current = embeddedDeckUrl
  }, [embeddedDeckUrl])

  useEffect(() => {
    productDemoUrlRef.current = productDemoUrl
  }, [productDemoUrl])

  useEffect(() => {
    productShotsRef.current = productShots
  }, [productShots])

  useEffect(() => {
    tractionLogosRef.current = tractionLogos
  }, [tractionLogos])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const demo = await loadProductDemoVideo()
        if (cancelled || !demo) return
        setProductDemoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(demo.blob)
        })
        setProductDemoName(demo.filename)
      } catch {
        if (!cancelled) setProductDemoError('Could not load saved demo video.')
      }
      try {
        const shots = await loadProductScreenshots()
        if (cancelled) return
        setProductShots(
          shots.map((s) => ({
            id: s.id,
            name: s.filename,
            url: URL.createObjectURL(s.blob),
          }))
        )
      } catch {
        if (!cancelled) setProductShotsError('Could not load saved screenshots.')
      }
      try {
        const logos = await loadTractionLogos()
        if (cancelled) return
        setTractionLogos(
          logos.map((L) => ({
            id: L.id,
            name: L.filename,
            url: URL.createObjectURL(L.blob),
          }))
        )
      } catch {
        if (!cancelled) setTractionLogosError('Could not load saved customer logos.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      const u = productDemoUrlRef.current
      if (u) URL.revokeObjectURL(u)
      productDemoUrlRef.current = null
      for (const s of productShotsRef.current) URL.revokeObjectURL(s.url)
      for (const s of tractionLogosRef.current) URL.revokeObjectURL(s.url)
    }
  }, [])

  useEffect(() => {
    return () => {
      const u = embeddedDeckUrlRef.current
      if (u) URL.revokeObjectURL(u)
      embeddedDeckUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isPresentingDeck) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPresentingDeck(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isPresentingDeck])

  useEffect(() => {
    if (deckFileName) {
      window.localStorage.setItem(STORAGE_ONE_PAGER_FILENAME_KEY, deckFileName)
    } else {
      window.localStorage.removeItem(STORAGE_ONE_PAGER_FILENAME_KEY)
    }
  }, [deckFileName])

  useEffect(() => {
    if (deckText.trim()) {
      window.localStorage.setItem(STORAGE_ONE_PAGER_DECK_TEXT_KEY, deckText)
    } else {
      window.localStorage.removeItem(STORAGE_ONE_PAGER_DECK_TEXT_KEY)
    }
  }, [deckText])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_FINANCIALS_KEY, JSON.stringify(financials))
  }, [financials])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_PRODUCT_ROADMAP_KEY, productRoadmap)
  }, [productRoadmap])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TRACTION_KEY, JSON.stringify(traction))
  }, [traction])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_MARKET_SIZING_KEY, JSON.stringify(marketSizing))
  }, [marketSizing])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_MARKET_COMPETITIVE_KEY, marketCompetitive)
  }, [marketCompetitive])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TEAM_WORKSPACE_KEY, JSON.stringify(teamWorkspace))
  }, [teamWorkspace])

  async function onDeckSelected(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setOnePagerError(null)
    setOnePagerSummary('')
    setDeckFileName(file.name)
    setIsExtractingPdf(true)
    setDeckText('')

    const lower = file.name.toLowerCase()
    const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf')

    if (!isPdf) {
      setDeckText('')
      setIsExtractingPdf(false)
      if (deckFileInputRef.current) {
        deckFileInputRef.current.value = ''
      }
      setOnePagerError(
        'For now, pitch deck summarization works best with PDF exports. Please export your deck to PDF and upload that file.'
      )
      return
    }

    try {
      const text = await extractPdfTextOnServer(file)
      const clipped = text.slice(0, MAX_PDF_TEXT_CHARS)
      setDeckText(clipped)
      if (!clipped.trim()) {
        setOnePagerError(
          'This PDF has no extractable text (common for image-only or “designer” templates). Add real copy in the slides, export again, or use Print → Save as PDF from the app that has the text.'
        )
      }
    } catch (error) {
      setDeckText('')
      const detail = error instanceof Error ? error.message : String(error)
      setOnePagerError(
        `Could not read this PDF (${detail}). Try exporting again as a normal (non‑protected) PDF, or use “Print → Save as PDF”.`
      )
    } finally {
      setIsExtractingPdf(false)
      if (deckFileInputRef.current) {
        deckFileInputRef.current.value = ''
      }
    }
  }

  async function onEmbeddedPitchDeckSelected(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setEmbeddedDeckError(null)
    const lower = file.name.toLowerCase()
    const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf')
    if (!isPdf) {
      setEmbeddedDeckError('Please upload a PDF file for embedding.')
      if (pitchDeckEmbedInputRef.current) pitchDeckEmbedInputRef.current.value = ''
      return
    }

    setEmbeddedDeckBusy(true)
    try {
      await saveEmbeddedPitchDeckPdf(file)
      setEmbeddedDeckUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setEmbeddedDeckName(file.name)

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const path = `${user.id}/embedded.pdf`
          const { error: uploadError } = await supabase.storage.from('pitch-decks').upload(path, file, {
            upsert: true,
            contentType: file.type || 'application/pdf',
          })
          if (uploadError) {
            throw new Error(uploadError.message)
          }
          const metaRes = await fetch('/api/platform/pitch-deck', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              mime: file.type || 'application/pdf',
            }),
          })
          if (!metaRes.ok) {
            const detail = await metaRes.text()
            throw new Error(detail || 'Could not save deck to your account.')
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save this PDF in the browser.'
      setEmbeddedDeckError(msg)
    } finally {
      setEmbeddedDeckBusy(false)
      if (pitchDeckEmbedInputRef.current) pitchDeckEmbedInputRef.current.value = ''
    }
  }

  async function clearEmbeddedPitchDeck() {
    setEmbeddedDeckError(null)
    setEmbeddedDeckBusy(true)
    try {
      await clearEmbeddedPitchDeckPdf()
      if (isSupabaseConfigured()) {
        await fetch('/api/platform/pitch-deck', { method: 'DELETE' })
      }
      setEmbeddedDeckUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setEmbeddedDeckName(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not remove the saved deck.'
      setEmbeddedDeckError(msg)
    } finally {
      setEmbeddedDeckBusy(false)
    }
  }

  async function onProductDemoSelected(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setProductDemoError(null)
    setProductDemoBusy(true)
    try {
      await saveProductDemoVideo(file)
      setProductDemoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setProductDemoName(file.name)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save the demo video.'
      setProductDemoError(msg)
    } finally {
      setProductDemoBusy(false)
      if (productDemoInputRef.current) productDemoInputRef.current.value = ''
    }
  }

  async function clearProductDemo() {
    setProductDemoError(null)
    setProductDemoBusy(true)
    try {
      await clearProductDemoVideo()
      setProductDemoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setProductDemoName(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not remove the demo video.'
      setProductDemoError(msg)
    } finally {
      setProductDemoBusy(false)
    }
  }

  async function onProductScreenshotsSelected(files: FileList | null) {
    if (!files?.length) return
    setProductShotsError(null)
    setProductShotsBusy(true)
    try {
      const existing = await loadProductScreenshotRows()
      if (existing.length >= MAX_SCREENSHOTS) {
        throw new Error(`You can store up to ${MAX_SCREENSHOTS} screenshots. Remove some first.`)
      }
      const toAdd: StoredScreenshotRow[] = []
      for (let i = 0; i < files.length; i++) {
        if (existing.length + toAdd.length >= MAX_SCREENSHOTS) break
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        if (file.size > MAX_SHOT_BYTES) {
          throw new Error(`Each image must be under ${Math.round(MAX_SHOT_BYTES / (1024 * 1024))} MB.`)
        }
        const data = await file.arrayBuffer()
        toAdd.push({
          id: crypto.randomUUID(),
          filename: file.name || `screenshot-${existing.length + toAdd.length + 1}.png`,
          mime: file.type || 'image/png',
          updatedAt: Date.now(),
          data,
        })
      }
      if (toAdd.length === 0) {
        throw new Error('No valid image files selected (PNG, JPG, WebP, etc.).')
      }
      await saveProductScreenshots([...existing, ...toAdd])
      const merged = await loadProductScreenshots()
      setProductShots((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return merged.map((L) => ({
          id: L.id,
          name: L.filename,
          url: URL.createObjectURL(L.blob),
        }))
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save screenshots.'
      setProductShotsError(msg)
    } finally {
      setProductShotsBusy(false)
      if (productShotsInputRef.current) productShotsInputRef.current.value = ''
    }
  }

  async function removeProductScreenshot(id: string) {
    setProductShotsError(null)
    setProductShotsBusy(true)
    try {
      const existing = await loadProductScreenshotRows()
      const next = existing.filter((row) => row.id !== id)
      await saveProductScreenshots(next)
      const merged = await loadProductScreenshots()
      setProductShots((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return merged.map((L) => ({
          id: L.id,
          name: L.filename,
          url: URL.createObjectURL(L.blob),
        }))
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not remove that screenshot.'
      setProductShotsError(msg)
    } finally {
      setProductShotsBusy(false)
    }
  }

  async function clearAllProductScreenshots() {
    setProductShotsError(null)
    setProductShotsBusy(true)
    try {
      await clearProductScreenshots()
      setProductShots((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return []
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not clear screenshots.'
      setProductShotsError(msg)
    } finally {
      setProductShotsBusy(false)
    }
  }

  function updateTractionNumber<K extends keyof TractionInputs>(key: K, value: number) {
    setTraction((prev) => ({ ...prev, [key]: value }))
  }

  async function onTractionLogosSelected(files: FileList | null) {
    if (!files?.length) return
    setTractionLogosError(null)
    setTractionLogosBusy(true)
    try {
      const existing = await loadTractionLogoRows()
      if (existing.length >= MAX_LOGOS) {
        throw new Error(`You can store up to ${MAX_LOGOS} logos. Remove some first.`)
      }
      const toAdd: StoredScreenshotRow[] = []
      for (let i = 0; i < files.length; i++) {
        if (existing.length + toAdd.length >= MAX_LOGOS) break
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        if (file.size > MAX_LOGO_BYTES) {
          throw new Error(`Each logo must be under ${Math.round(MAX_LOGO_BYTES / (1024 * 1024))} MB.`)
        }
        const data = await file.arrayBuffer()
        toAdd.push({
          id: crypto.randomUUID(),
          filename: file.name || `logo-${existing.length + toAdd.length + 1}.png`,
          mime: file.type || 'image/png',
          updatedAt: Date.now(),
          data,
        })
      }
      if (toAdd.length === 0) {
        throw new Error('No valid image files selected (PNG, JPG, WebP, SVG as PNG, etc.).')
      }
      await saveTractionLogos([...existing, ...toAdd])
      const merged = await loadTractionLogos()
      setTractionLogos((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return merged.map((L) => ({
          id: L.id,
          name: L.filename,
          url: URL.createObjectURL(L.blob),
        }))
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save logos.'
      setTractionLogosError(msg)
    } finally {
      setTractionLogosBusy(false)
      if (tractionLogoInputRef.current) tractionLogoInputRef.current.value = ''
    }
  }

  async function removeTractionLogo(id: string) {
    setTractionLogosError(null)
    setTractionLogosBusy(true)
    try {
      const existing = await loadTractionLogoRows()
      const next = existing.filter((row) => row.id !== id)
      await saveTractionLogos(next)
      const merged = await loadTractionLogos()
      setTractionLogos((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return merged.map((L) => ({
          id: L.id,
          name: L.filename,
          url: URL.createObjectURL(L.blob),
        }))
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not remove that logo.'
      setTractionLogosError(msg)
    } finally {
      setTractionLogosBusy(false)
    }
  }

  async function clearAllTractionLogos() {
    setTractionLogosError(null)
    setTractionLogosBusy(true)
    try {
      await clearTractionLogos()
      setTractionLogos((prev) => {
        for (const p of prev) URL.revokeObjectURL(p.url)
        return []
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not clear logos.'
      setTractionLogosError(msg)
    } finally {
      setTractionLogosBusy(false)
    }
  }

  async function generateOnePager() {
    if (!deckText.trim()) {
      setOnePagerError(
        deckFileName
          ? 'No deck text is available yet. Wait for extraction to finish, re-select the PDF, or use a PDF where you can select/copy text from the slides.'
          : 'Choose a pitch deck PDF first. After upload, you should see “N KB text extracted” below the filename.'
      )
      return
    }

    setIsGeneratingOnePager(true)
    setOnePagerError(null)

    const prompt = [
      'You are helping a founder turn a pitch deck into a crisp 1-pager.',
      '',
      'Using ONLY the deck text below, produce:',
      '1) Company Overview (1-pager): problem, solution, who it is for, traction (only if present), business model (only if present), differentiation, and what you are raising (only if present).',
      '2) Elevator pitch: 2-3 sentences, confident, specific, no buzzword soup.',
      '',
      'Rules:',
      '- If something is missing, say "Not stated in deck" instead of inventing.',
      '- Keep it tight and readable.',
      '',
      'Formatting (required):',
      '- First line of your reply (exact pattern): TITLE: <short page title, max 12 words — usually company or product name, e.g. TITLE: Acme Robotics — One pager>',
      '- Second line: blank.',
      '- Then write the rest as Markdown (the editor will convert it to rich text).',
      '- Use ## for each major section (e.g. ## Company overview, ## Elevator pitch).',
      '- Use **Label:** for short inline labels when helpful (e.g. **Who it is for:** mid-market …).',
      '- Use normal Markdown bullet lists (- item) for enumerations.',
      '- Use a short intro line, then sections—no code fences around the answer.',
      '',
      'DECK TEXT:',
      deckText,
    ].join('\n')

    try {
      const response = await fetch('/api/platform/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: [],
          context: deckText,
          documents: deckFileName ? [{ name: deckFileName }] : [],
        }),
      })

      const payload = (await response.json()) as { answer?: string; error?: string } | undefined
      if (!response.ok || !payload?.answer) {
        throw new Error(payload?.error || 'Failed to generate one pager.')
      }
      const { title: generatedTitle, bodyMarkdown } = splitGeneratedTitleBlock(payload.answer)
      const prevViewTitle = onePagerViewTitleRef.current
      const nextViewTitle =
        generatedTitle ?? (prevViewTitle.trim() ? prevViewTitle : titleFromDeckFilename(deckFileName))
      setOnePagerViewTitle(nextViewTitle)
      setOnePagerSummary(aiMarkdownToEditorHtml(bodyMarkdown))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate one pager.'
      setOnePagerError(message)
    } finally {
      setIsGeneratingOnePager(false)
    }
  }

  async function runSmartFill() {
    if (!deckText.trim()) {
      setSmartFillError(
        deckFileName
          ? 'No deck text yet. Wait for extraction or re-upload a PDF with selectable text.'
          : 'Upload a pitch deck PDF and wait until you see extracted text below the filename.'
      )
      return
    }

    setSmartFillError(null)
    setIsSmartFilling(true)
    try {
      const response = await fetch('/api/platform/smart-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckText, deckFileName }),
      })
      const payload = (await response.json()) as { data?: SmartFillData; error?: string }
      if (!response.ok || !payload.data) {
        throw new Error(payload.error || 'Smart fill failed.')
      }
      const data = payload.data

      const narrativeMd = buildSmartFillNarrativeMd(data)
      if (narrativeMd) {
        const narrativeHtml = aiMarkdownToEditorHtml(narrativeMd)
        setOnePagerSummary((prev) => {
          if (workspacePlainLen(prev) < 120) return narrativeHtml
          return `${prev}<hr /><h2>Draft from deck (AI)</h2>${narrativeHtml}`
        })
      }

      setOnePagerViewTitle((prev) => {
        const t = prev.trim()
        if (t) return t
        const s = data.suggestedPageTitle?.trim()
        if (s) return s
        return titleFromDeckFilename(deckFileName)
      })

      setMarketSizing((prev) => ({
        ...prev,
        ...(data.tamUsd != null ? { tam: data.tamUsd } : {}),
        ...(data.samUsd != null ? { sam: data.samUsd } : {}),
        ...(data.somUsd != null ? { som: data.somUsd } : {}),
      }))

      if (data.competitiveLandscapeMd) {
        const compHtml = aiMarkdownToEditorHtml(data.competitiveLandscapeMd)
        setMarketCompetitive((prev) => {
          if (workspacePlainLen(prev) < 40) return compHtml
          return `${prev}<hr />${compHtml}`
        })
      }

      if (data.teamMembers.length > 0) {
        setTeamWorkspace(data.teamMembers)
      }
    } catch (error) {
      setSmartFillError(error instanceof Error ? error.message : 'Smart fill failed.')
    } finally {
      setIsSmartFilling(false)
    }
  }

  function presentDocument(viewTitle: string, html: string) {
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) return
    const safeTitle = (viewTitle || 'Document').trim() || 'Document'
    const content = html.trim() || '<p></p>'
    popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      body { margin: 0; background: #ffffff; color: #111827; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; }
      .wrap { max-width: 72rem; margin: 0 auto; padding: 3rem 2.5rem 4rem; }
      h1 { font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 1.25rem; letter-spacing: -0.03em; line-height: 1.1; }
      .doc { font-size: 1.18rem; line-height: 1.75; }
      .doc h2, .doc h3 { line-height: 1.25; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #0f172a; }
      .doc ul, .doc ol { padding-left: 1.4rem; }
      .doc blockquote { border-left: 3px solid #e5e7eb; padding-left: 1rem; color: #475569; margin-left: 0; }
      @media (max-width: 900px) { .wrap { padding: 1.5rem 1rem 2rem; } .doc { font-size: 1.02rem; } }
      @media print { .wrap { max-width: 100%; padding: 0; } }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>${safeTitle}</h1>
      <article class="doc">${content}</article>
    </main>
  </body>
</html>`)
    popup.document.close()
  }

  function updateFinancialNumber<K extends keyof FinancialInputs>(key: K, value: number) {
    setFinancials((prev) => ({ ...prev, [key]: value }))
  }

  function updateMarketSizing<K extends keyof MarketSizing>(key: K, value: number) {
    setMarketSizing((prev) => ({ ...prev, [key]: value }))
  }

  const grossMarginPct = 100 - financials.cogsPct
  const variableCost = financials.mrr * (financials.cogsPct / 100)
  const grossProfit = financials.mrr - variableCost
  const totalMonthlyCosts = financials.monthlyOpex + financials.monthlyDebt
  const netBurn = totalMonthlyCosts - grossProfit
  const arr = financials.mrr * 12
  const runwayMonths = netBurn > 0 ? financials.cashOnHand / netBurn : Number.POSITIVE_INFINITY

  let cumulativeBurn = 0
  const projectionRows = Array.from({ length: Math.max(1, Math.round(financials.projectionMonths)) }, (_, i) => {
    const month = i + 1
    const mrrAtMonth =
      financials.mrr * Math.pow(1 + financials.monthlyRevenueGrowthPct / 100, i) + financials.newMrrPerMonth * i
    const variableAtMonth = mrrAtMonth * (financials.cogsPct / 100)
    const fixedCostsAtMonth = totalMonthlyCosts * Math.pow(1 + financials.monthlyExpenseGrowthPct / 100, i)
    const netBurnAtMonth = fixedCostsAtMonth - (mrrAtMonth - variableAtMonth)
    cumulativeBurn += netBurnAtMonth
    const cashRemaining = financials.cashOnHand - cumulativeBurn

    return { month, mrrAtMonth, fixedCostsAtMonth, netBurnAtMonth, cashRemaining }
  })

  const displayTeam = teamWorkspace.length > 0 ? teamWorkspace : HOME_TEAM

  return (
    <main className="notion-page">
      <div className="notion-shell">
        <aside className="notion-sidebar" aria-label="Sidebar">
          <div className="notion-sidebar-brand-row">
            <div className="notion-sidebar-brand">Workspace</div>
            {isSupabaseConfigured() && (
              <div className="notion-sidebar-account">
                {accountEmail ? (
                  <span className="notion-sidebar-account-email" title={accountEmail}>
                    {accountEmail}
                  </span>
                ) : null}
                <button type="button" className="notion-sidebar-sign-out" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            )}
          </div>
          <nav className="notion-sidebar-nav">
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'onepager' ? 'is-active' : ''}`}
              onClick={() => goToTab('onepager')}
            >
              One pager
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'pitchdeck' ? 'is-active' : ''}`}
              onClick={() => goToTab('pitchdeck')}
            >
              Pitch deck
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'market' ? 'is-active' : ''}`}
              onClick={() => goToTab('market')}
            >
              Market
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'product' ? 'is-active' : ''}`}
              onClick={() => goToTab('product')}
            >
              Product
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'traction' ? 'is-active' : ''}`}
              onClick={() => goToTab('traction')}
            >
              Traction
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'team' ? 'is-active' : ''}`}
              onClick={() => goToTab('team')}
            >
              Team
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${workspaceTabActive && activeTab === 'financials' ? 'is-active' : ''}`}
              onClick={() => goToTab('financials')}
            >
              Financials
            </button>
          </nav>

          {cloud.enabled ? (
            <CloudWorkspaceSidebar
              cloud={cloud}
              insightsByDoc={workspaceInsights.byDocId}
              onOpenDoc={() => {
                setActiveBlankDocId(null)
              }}
            />
          ) : (
            <div className="notion-sidebar-docs">
              <div className="notion-sidebar-docs-head">
                <span className="notion-sidebar-docs-label">Documents</span>
                <button
                  type="button"
                  className="notion-sidebar-add-doc"
                  onClick={addBlankWorkspaceDocument}
                  title="New blank document"
                  aria-label="New blank document"
                >
                  +
                </button>
              </div>
              {blankWorkspaceDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className={`notion-sidebar-item notion-sidebar-doc-item ${
                    activeBlankDocId === doc.id ? 'is-active' : ''
                  }`}
                  onClick={() => setActiveBlankDocId(doc.id)}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="notion-main">
          {cloud.enabled && cloud.activeDoc ? (
            <CloudWorkspaceEditor
              cloud={cloud}
              insightsByDoc={workspaceInsights.byDocId}
              workspaceDocCount={workspaceInsights.workspaceDocCount}
            />
          ) : activeBlankDoc ? (
            <article className="notion-doc" aria-label={activeBlankDoc.title}>
              <div className="notion-doc-tools notion-blank-doc-tools">
                <span className="notion-blank-doc-hint">Rich text · saved in this browser</span>
              </div>
              <input
                className="notion-title"
                placeholder="Untitled"
                value={activeBlankDoc.title}
                onChange={(event) => {
                  const title = event.target.value
                  setBlankWorkspaceDocs((prev) =>
                    prev.map((d) => (d.id === activeBlankDoc.id ? { ...d, title } : d))
                  )
                }}
              />
              <RichDocEditor
                value={activeBlankDoc.bodyHtml}
                onChange={(html) =>
                  setBlankWorkspaceDocs((prev) =>
                    prev.map((d) => (d.id === activeBlankDoc.id ? { ...d, bodyHtml: html } : d))
                  )
                }
                placeholder="Blank page — write notes, memos, or drafts here."
              />
            </article>
          ) : activeTab === 'onepager' ? (
            <article className="notion-doc" aria-label="One pager from pitch deck">
              <div className="notion-doc-tools">
                <label className="notion-upload">
                  <span className="notion-upload-label">Pitch deck (PDF)</span>
                  <input
                    ref={deckFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf,.ppt,.pptx"
                    onChange={(event) => void onDeckSelected(event.target.files)}
                  />
                  {deckFileName && (
                    <span className="notion-upload-meta">
                      Selected: {deckFileName}
                      {isExtractingPdf
                        ? ' · Extracting text…'
                        : deckText
                          ? ` · ${Math.round(deckText.length / 1024)} KB text extracted`
                          : ' · No text extracted yet'}
                    </span>
                  )}
                </label>
                <div className="notion-doc-tools-actions">
                  <button
                    type="button"
                    onClick={() => presentDocument(onePagerViewTitle || 'One pager', onePagerSummary)}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    className="notion-doc-tool-secondary"
                    onClick={() => void runSmartFill()}
                    disabled={
                      isSmartFilling ||
                      isGeneratingOnePager ||
                      isExtractingPdf ||
                      !deckText.trim()
                    }
                  >
                    {isSmartFilling ? 'Smart fill…' : 'Smart fill with AI'}
                  </button>
                  <button
                    type="button"
                    onClick={generateOnePager}
                    disabled={
                      isSmartFilling ||
                      isGeneratingOnePager ||
                      isExtractingPdf ||
                      !deckText.trim()
                    }
                  >
                    {isGeneratingOnePager ? 'Generating…' : 'Generate 1-pager'}
                  </button>
                </div>
              </div>

              {smartFillError && <p className="notion-doc-error">{smartFillError}</p>}
              {onePagerError && <p className="notion-doc-error">{onePagerError}</p>}

              <input
                className="notion-title"
                placeholder="One pager"
                value={onePagerViewTitle}
                onChange={(event) => setOnePagerViewTitle(event.target.value)}
              />

              <RichDocEditor
                value={onePagerSummary}
                onChange={setOnePagerSummary}
                placeholder="Upload a pitch deck PDF above, then generate—or write and format your one pager here."
              />
            </article>
          ) : activeTab === 'pitchdeck' ? (
            <article className="notion-doc notion-deck-tab" aria-label="Embedded pitch deck">
              <header className="notion-deck-head">
                <h1 className="notion-deck-title">Pitch deck</h1>
              </header>

              <div className="notion-deck-toolbar">
                <label className="notion-upload">
                  <span className="notion-upload-label">Deck (PDF)</span>
                  <input
                    ref={pitchDeckEmbedInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={embeddedDeckBusy}
                    onChange={(event) => void onEmbeddedPitchDeckSelected(event.target.files)}
                  />
                  {embeddedDeckName && (
                    <span className="notion-upload-meta">Saved: {embeddedDeckName}</span>
                  )}
                </label>
                <div className="notion-deck-toolbar-actions">
                  {embeddedDeckUrl && (
                    <button
                      type="button"
                      className="notion-deck-present"
                      disabled={embeddedDeckBusy}
                      onClick={() => setIsPresentingDeck(true)}
                    >
                      Present
                    </button>
                  )}
                  {embeddedDeckUrl && (
                    <button
                      type="button"
                      className="notion-deck-clear"
                      disabled={embeddedDeckBusy}
                      onClick={() => void clearEmbeddedPitchDeck()}
                    >
                      Remove from app
                    </button>
                  )}
                </div>
              </div>

              {embeddedDeckError && <p className="notion-doc-error">{embeddedDeckError}</p>}

              {embeddedDeckBusy && !embeddedDeckUrl && (
                <p className="notion-deck-hint">Saving deck in your browser…</p>
              )}

              {embeddedDeckUrl ? (
                <div className="notion-deck-viewer">
                  <iframe
                    title={embeddedDeckName ? `Pitch deck: ${embeddedDeckName}` : 'Pitch deck PDF'}
                    src={`${embeddedDeckUrl}#toolbar=1`}
                    className="notion-deck-iframe"
                  />
                </div>
              ) : (
                !embeddedDeckBusy && (
                  <div className="notion-deck-empty">
                    <p>No deck embedded yet. Choose a PDF above to preview it here whenever you return.</p>
                  </div>
                )
              )}
            </article>
          ) : activeTab === 'market' ? (
            <article className="notion-doc notion-market-tab" aria-label="Market">
              <header className="notion-market-head">
                <h1 className="notion-market-title">Market</h1>
                <p className="notion-market-sub">
                  Total addressable, serviceable, and obtainable revenue — plus how you fit against alternatives.
                </p>
              </header>

              <section className="notion-market-kpis" aria-label="TAM SAM SOM">
                <article>
                  <h3>TAM</h3>
                  <p>{formatMarketMoney(marketSizing.tam)}</p>
                  <p className="notion-market-kpi-def">Total addressable market</p>
                </article>
                <article>
                  <h3>SAM</h3>
                  <p>{formatMarketMoney(marketSizing.sam)}</p>
                  <p className="notion-market-kpi-def">Serviceable addressable market</p>
                </article>
                <article>
                  <h3>SOM</h3>
                  <p>{formatMarketMoney(marketSizing.som)}</p>
                  <p className="notion-market-kpi-def">Serviceable obtainable (near-term)</p>
                </article>
              </section>

              <div className="notion-market-funnel" aria-label="Market sizing funnel (relative to TAM)">
                <div className="notion-market-funnel-row notion-market-funnel-tam">
                  <span>TAM</span>
                  <div
                    className="notion-market-funnel-bar"
                    style={{
                      width: marketSizing.tam > 0 ? '100%' : '0%',
                    }}
                  />
                </div>
                <div className="notion-market-funnel-row notion-market-funnel-sam">
                  <span>SAM</span>
                  <div
                    className="notion-market-funnel-bar"
                    style={{
                      width:
                        marketSizing.tam > 0
                          ? `${clamp((marketSizing.sam / marketSizing.tam) * 100, 0, 100)}%`
                          : '0%',
                    }}
                  />
                </div>
                <div className="notion-market-funnel-row notion-market-funnel-som">
                  <span>SOM</span>
                  <div
                    className="notion-market-funnel-bar"
                    style={{
                      width:
                        marketSizing.tam > 0
                          ? `${clamp((marketSizing.som / marketSizing.tam) * 100, 0, 100)}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>

              <section className="notion-market-grid" aria-label="Market sizing inputs">
                <label className="notion-market-field">
                  <span>TAM ($)</span>
                  <input
                    type="number"
                    min={0}
                    value={marketSizing.tam}
                    onChange={(e) => updateMarketSizing('tam', Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label className="notion-market-field">
                  <span>SAM ($)</span>
                  <input
                    type="number"
                    min={0}
                    value={marketSizing.sam}
                    onChange={(e) => updateMarketSizing('sam', Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label className="notion-market-field">
                  <span>SOM ($)</span>
                  <input
                    type="number"
                    min={0}
                    value={marketSizing.som}
                    onChange={(e) => updateMarketSizing('som', Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
              </section>

              <section className="notion-market-competitive" aria-label="Competitive landscape">
                <h2 className="notion-market-h2">Competitive landscape</h2>
                <p className="notion-market-competitive-hint">
                  Competitors, category alternatives, positioning, and why you win — tables and bullets work well here.
                </p>
                <RichDocEditor
                  value={marketCompetitive}
                  onChange={setMarketCompetitive}
                  placeholder={`## Direct competitors
- **Acme** — enterprise incumbents, slow innovation…

## Indirect / status quo
- Spreadsheets, agencies, in-house tools…

## Differentiation
What only you can claim (with proof).`}
                />
              </section>
            </article>
          ) : activeTab === 'product' ? (
            <article className="notion-doc notion-product-tab" aria-label="Product workspace">
              <header className="notion-product-head">
                <h1 className="notion-product-title">Product</h1>
              </header>

              <section className="notion-product-section" aria-label="Demo video">
                <h2 className="notion-product-h2">Demo video</h2>
                <div className="notion-product-toolbar">
                  <label className="notion-upload">
                    <span className="notion-upload-label">Upload video</span>
                    <input
                      ref={productDemoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                      disabled={productDemoBusy}
                      onChange={(event) => void onProductDemoSelected(event.target.files)}
                    />
                    {productDemoName && (
                      <span className="notion-upload-meta">Saved: {productDemoName}</span>
                    )}
                  </label>
                  {productDemoUrl && (
                    <button
                      type="button"
                      className="notion-product-secondary"
                      disabled={productDemoBusy}
                      onClick={() => void clearProductDemo()}
                    >
                      Remove video
                    </button>
                  )}
                </div>
                {productDemoError && <p className="notion-doc-error">{productDemoError}</p>}
                {productDemoBusy && <p className="notion-product-hint">Saving video…</p>}
                {productDemoUrl ? (
                  <video className="notion-product-video" controls playsInline src={productDemoUrl} />
                ) : (
                  !productDemoBusy && (
                    <p className="notion-product-empty">Add a short product walkthrough or demo reel. Stored in this browser only.</p>
                  )
                )}
              </section>

              <section className="notion-product-section" aria-label="Screenshots">
                <h2 className="notion-product-h2">Screenshots</h2>
                <div className="notion-product-toolbar">
                  <label className="notion-upload">
                    <span className="notion-upload-label">Add images</span>
                    <input
                      ref={productShotsInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
                      multiple
                      disabled={productShotsBusy}
                      onChange={(event) => void onProductScreenshotsSelected(event.target.files)}
                    />
                    <span className="notion-upload-meta">
                      {productShots.length} / {MAX_SCREENSHOTS} · max {Math.round(MAX_SHOT_BYTES / (1024 * 1024))} MB each
                    </span>
                  </label>
                  {productShots.length > 0 && (
                    <button
                      type="button"
                      className="notion-product-secondary"
                      disabled={productShotsBusy}
                      onClick={() => void clearAllProductScreenshots()}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {productShotsError && <p className="notion-doc-error">{productShotsError}</p>}
                {productShotsBusy && <p className="notion-product-hint">Updating gallery…</p>}
                {productShots.length > 0 ? (
                  <ul className="notion-product-gallery">
                    {productShots.map((shot) => (
                      <li key={shot.id} className="notion-product-gallery-item">
                        {/* eslint-disable-next-line @next/next/no-img-element -- blob URLs from IndexedDB */}
                        <img src={shot.url} alt={shot.name} loading="lazy" />
                        <div className="notion-product-gallery-meta">
                          <span className="notion-product-gallery-name">{shot.name}</span>
                          <button
                            type="button"
                            className="notion-product-gallery-remove"
                            disabled={productShotsBusy}
                            onClick={() => void removeProductScreenshot(shot.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !productShotsBusy && (
                    <p className="notion-product-empty">Drop UI captures, marketing shots, or release notes visuals here.</p>
                  )
                )}
              </section>

              <section className="notion-product-section notion-product-roadmap" aria-label="Roadmap">
                <h2 className="notion-product-h2">Roadmap</h2>
                <RichDocEditor
                  value={productRoadmap}
                  onChange={setProductRoadmap}
                  placeholder="Ship timeline, milestones, themes (Now / Next / Later), links to tickets—whatever helps you tell the product story."
                />
              </section>
            </article>
          ) : activeTab === 'traction' ? (
            <article className="notion-doc notion-traction-tab" aria-label="Traction">
              <header className="notion-traction-head">
                <h1 className="notion-traction-title">Traction</h1>
                <p className="notion-traction-sub">
                  Key metrics, an MRR trajectory you control, and customer logos for your narrative. Stored in this
                  browser only.
                </p>
              </header>

              <section className="notion-traction-kpis" aria-label="Key metrics">
                <article>
                  <h3>MRR</h3>
                  <p>{formatMoney(traction.mrr)}</p>
                </article>
                <article>
                  <h3>ARR</h3>
                  <p>{formatMoney(traction.mrr * 12)}</p>
                </article>
                <article>
                  <h3>Customers</h3>
                  <p>{traction.customers.toLocaleString('en-US')}</p>
                </article>
                <article>
                  <h3>NRR</h3>
                  <p>{traction.nrrPct.toFixed(0)}%</p>
                </article>
              </section>

              <section className="notion-traction-grid" aria-label="Traction inputs">
                <label className="notion-traction-field">
                  <span>Latest MRR ($)</span>
                  <input
                    type="number"
                    min={0}
                    value={traction.mrr}
                    onChange={(e) => updateTractionNumber('mrr', Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label className="notion-traction-field">
                  <span>Paying customers</span>
                  <input
                    type="number"
                    min={0}
                    value={traction.customers}
                    onChange={(e) => updateTractionNumber('customers', Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label className="notion-traction-field">
                  <span>Implied MoM growth %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={traction.momGrowthPct}
                    onChange={(e) => updateTractionNumber('momGrowthPct', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-traction-field">
                  <span>NRR %</span>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={traction.nrrPct}
                    onChange={(e) =>
                      updateTractionNumber('nrrPct', clamp(Number(e.target.value) || 0, 0, 300))
                    }
                  />
                </label>
                <label className="notion-traction-field notion-traction-field-span">
                  <span>Chart length (months)</span>
                  <input
                    type="number"
                    min={3}
                    max={24}
                    value={traction.chartMonths}
                    onChange={(e) =>
                      updateTractionNumber('chartMonths', clamp(Number(e.target.value) || 12, 3, 24))
                    }
                  />
                </label>
              </section>

              <section className="notion-traction-chart" aria-label="MRR growth chart">
                <h2 className="notion-traction-h2">MRR trajectory</h2>
                <p className="notion-traction-chart-hint">
                  Curve is implied from latest MRR and MoM % — useful for slides; replace with real cohort data when you
                  have it.
                </p>
                <TractionMrrChart series={buildMrrSeries(traction.mrr, traction.momGrowthPct, traction.chartMonths)} />
              </section>

              <section className="notion-traction-logos" aria-label="Customer logos">
                <h2 className="notion-traction-h2">Customer logos</h2>
                <div className="notion-traction-toolbar">
                  <label className="notion-upload">
                    <span className="notion-upload-label">Add logos</span>
                    <input
                      ref={tractionLogoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
                      multiple
                      disabled={tractionLogosBusy}
                      onChange={(event) => void onTractionLogosSelected(event.target.files)}
                    />
                    <span className="notion-upload-meta">
                      {tractionLogos.length} / {MAX_LOGOS} · max {Math.round(MAX_LOGO_BYTES / (1024 * 1024))} MB each
                    </span>
                  </label>
                  {tractionLogos.length > 0 && (
                    <button
                      type="button"
                      className="notion-product-secondary"
                      disabled={tractionLogosBusy}
                      onClick={() => void clearAllTractionLogos()}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {tractionLogosError && <p className="notion-doc-error">{tractionLogosError}</p>}
                {tractionLogosBusy && <p className="notion-traction-hint">Updating logos…</p>}
                {tractionLogos.length > 0 ? (
                  <ul className="notion-traction-logo-grid">
                    {tractionLogos.map((logo) => (
                      <li key={logo.id} className="notion-traction-logo-cell">
                        {/* eslint-disable-next-line @next/next/no-img-element -- blob URLs from IndexedDB */}
                        <img src={logo.url} alt={logo.name} loading="lazy" />
                        <div className="notion-traction-logo-meta">
                          <span className="notion-traction-logo-name">{logo.name}</span>
                          <button
                            type="button"
                            className="notion-traction-logo-remove"
                            disabled={tractionLogosBusy}
                            onClick={() => void removeTractionLogo(logo.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !tractionLogosBusy && (
                    <p className="notion-traction-empty">
                      Upload PNG or SVG exports of customer marks. Shown in a neutral tile so light and dark logos both
                      read well.
                    </p>
                  )
                )}
              </section>
            </article>
          ) : activeTab === 'team' ? (
            <article className="notion-doc notion-team-tab" aria-label="Team">
              <header className="notion-team-head">
                <h1 className="notion-team-title">Team</h1>
                <p className="notion-team-sub">
                  Who is building this — bios, LinkedIn, and relevant experience.
                </p>
                {teamWorkspace.length > 0 && (
                  <p className="notion-team-smartfill-note">
                    Showing roster from Smart fill (your deck).
                    <button type="button" className="notion-team-smartfill-reset" onClick={() => setTeamWorkspace([])}>
                      Restore template team
                    </button>
                  </p>
                )}
              </header>
              <ul className="notion-team-grid">
                {displayTeam.map((member, memberIdx) => (
                  <li key={`${member.name}-${memberIdx}`} className="notion-team-card">
                    <div className="notion-team-card-head">
                      <h2 className="notion-team-name">{member.name}</h2>
                      <p className="notion-team-role">{member.role}</p>
                    </div>
                    <p className="notion-team-bio">{member.bio}</p>
                    <a
                      className="notion-team-linkedin"
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn (opens in a new tab)`}
                    >
                      LinkedIn profile
                    </a>
                    <div className="notion-team-exp">
                      <h3 className="notion-team-exp-title">Relevant experience</h3>
                      <ul>
                        {member.experience.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ) : (
            <article className="notion-doc notion-financials-tab" aria-label="Financials dashboard">
              <header className="notion-financials-head">
                <h1 className="notion-financials-title">Financials</h1>
                <p className="notion-financials-sub">Track MRR, burn rate, runway, and your forward cash plan.</p>
              </header>

              <section className="notion-financials-grid">
                <label className="notion-financials-field">
                  <span>Cash on hand</span>
                  <input
                    type="number"
                    value={financials.cashOnHand}
                    onChange={(e) => updateFinancialNumber('cashOnHand', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>MRR</span>
                  <input
                    type="number"
                    value={financials.mrr}
                    onChange={(e) => updateFinancialNumber('mrr', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>COGS %</span>
                  <input
                    type="number"
                    value={financials.cogsPct}
                    onChange={(e) => updateFinancialNumber('cogsPct', clamp(Number(e.target.value) || 0, 0, 100))}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>Monthly OPEX</span>
                  <input
                    type="number"
                    value={financials.monthlyOpex}
                    onChange={(e) => updateFinancialNumber('monthlyOpex', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>Monthly debt payments</span>
                  <input
                    type="number"
                    value={financials.monthlyDebt}
                    onChange={(e) => updateFinancialNumber('monthlyDebt', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>Revenue growth % / month</span>
                  <input
                    type="number"
                    value={financials.monthlyRevenueGrowthPct}
                    onChange={(e) => updateFinancialNumber('monthlyRevenueGrowthPct', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>Expense growth % / month</span>
                  <input
                    type="number"
                    value={financials.monthlyExpenseGrowthPct}
                    onChange={(e) => updateFinancialNumber('monthlyExpenseGrowthPct', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>New MRR added / month</span>
                  <input
                    type="number"
                    value={financials.newMrrPerMonth}
                    onChange={(e) => updateFinancialNumber('newMrrPerMonth', Number(e.target.value) || 0)}
                  />
                </label>
                <label className="notion-financials-field">
                  <span>Projection months</span>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={financials.projectionMonths}
                    onChange={(e) =>
                      updateFinancialNumber('projectionMonths', clamp(Number(e.target.value) || 12, 3, 60))
                    }
                  />
                </label>
              </section>

              <section className="notion-financials-kpis">
                <article>
                  <h3>ARR</h3>
                  <p>{formatMoney(arr)}</p>
                </article>
                <article>
                  <h3>Gross margin</h3>
                  <p>{grossMarginPct.toFixed(1)}%</p>
                </article>
                <article>
                  <h3>Net burn / month</h3>
                  <p>{formatMoney(netBurn)}</p>
                </article>
                <article>
                  <h3>Runway</h3>
                  <p>{Number.isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} months` : 'Profitable / infinite'}</p>
                </article>
              </section>

              <section className="notion-financials-table-wrap">
                <h2>Projection</h2>
                <div className="notion-financials-table-scroll">
                  <table className="notion-financials-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>MRR</th>
                        <th>Fixed costs</th>
                        <th>Net burn</th>
                        <th>Cash remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectionRows.map((row) => (
                        <tr key={row.month}>
                          <td>M{row.month}</td>
                          <td>{formatMoney(row.mrrAtMonth)}</td>
                          <td>{formatMoney(row.fixedCostsAtMonth)}</td>
                          <td>{formatMoney(row.netBurnAtMonth)}</td>
                          <td className={row.cashRemaining < 0 ? 'is-negative' : ''}>{formatMoney(row.cashRemaining)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </article>
          )}
        </div>
      </div>
      {isPresentingDeck && embeddedDeckUrl && (
        <div className="notion-deck-present-overlay" role="dialog" aria-modal="true" aria-label="Pitch deck presentation">
          <div className="notion-deck-present-topbar">
            <div className="notion-deck-present-title">{embeddedDeckName || 'Pitch deck'}</div>
            <button type="button" className="notion-deck-present-exit" onClick={() => setIsPresentingDeck(false)}>
              Exit presentation
            </button>
          </div>
          <iframe
            title={embeddedDeckName ? `Pitch deck presentation: ${embeddedDeckName}` : 'Pitch deck presentation'}
            src={`${embeddedDeckUrl}#toolbar=0&navpanes=0`}
            className="notion-deck-present-iframe"
          />
        </div>
      )}
    </main>
  )
}
