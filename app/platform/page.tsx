'use client'

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { flushSync } from 'react-dom'
import { OriginalPdfPreview } from '@/components/platform/OriginalPdfPreview'
import { PlatformTopBar } from '@/components/platform/PlatformTopBar'
import { AgentOpenFab } from '@/components/platform/AgentOpenFab'
import { PlatformAgentPanel } from '@/components/platform/PlatformAgentPanel'
import { RichDocEditor } from '@/components/platform/RichDocEditor'
import { aiMarkdownToEditorHtml, coerceStoredEditorHtml } from '@/components/platform/editorHtml'
import { buildCrossDocEditorMarks } from '@/lib/platform/buildCrossDocEditorMarks'
import {
  computeWorkspaceCrossDocIssues,
  DEFAULT_CROSS_DOC_PREFS,
  loadCrossDocPrefs,
  saveCrossDocPrefs,
  type CrossDocPrefsV1,
} from '@/lib/platform/crossDocWorkspace'
import type { ClaimsStore } from '@/lib/platform/docClaimsStore'
import { groundedClaimsAndEvidence } from '@/lib/platform/claimsGrounding'
import {
  CLAIM_KEYS,
  emptyClaimEvidenceRecord,
  emptyClaimsRecord,
  normalizeClaimEvidence,
  type ClaimEvidenceRecord,
  type ClaimsRecord,
} from '@/lib/platform/claimsSchema'
import {
  classifyWorkspaceFile,
  MAX_WORKSPACE_FOLDER_FILE_CHARS,
  plainExtractToEditorHtml,
  type WorkspaceFolderFileKind,
} from '@/lib/platform/workspaceFolders'
import {
  heuristicExtractClaimsWithEvidence,
  mergeClaimEvidence,
  mergeClaimRecords,
} from '@/lib/platform/heuristicExtractClaims'

const SOURCE_KINDS: ReadonlySet<WorkspaceFolderFileKind> = new Set([
  'pdf',
  'docx',
  'pptx',
  'markdown',
  'text',
])

const STORAGE_PLATFORM_DOCS = 'platform_uploaded_docs_v1'
const STORAGE_LEGACY_DEMO_DOCS = 'platform_demo_docs_v1'
const STORAGE_CLAIMS_GRAPH = 'platform_claims_graph_v1'
const MAX_PLATFORM_DOCS = 50

type PlatformDoc = {
  id: string
  title: string
  bodyHtml: string
  status: 'loading' | 'ready' | 'error'
  error?: string
  /** Persisted: original upload kind (PDF preview is session-only). */
  sourceKind?: WorkspaceFolderFileKind
  /** Session-only blob URL for native PDF layout (not saved to localStorage). */
  originalPreviewUrl?: string
  /** Auto-created empty doc when the workspace has no files yet (persisted). */
  blankStarter?: boolean
}

type PendingExtraction = { id: string; file: File; kind: WorkspaceFolderFileKind }

function htmlToPlain(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function makeBlankStarterDoc(): PlatformDoc {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    bodyHtml: '',
    status: 'ready',
    blankStarter: true,
  }
}

/** User-created blank doc (not the initial workspace starter). */
function makeBlankDocument(): PlatformDoc {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    bodyHtml: '',
    status: 'ready',
  }
}

function isEmptyStarterOnly(docs: PlatformDoc[]): boolean {
  if (docs.length !== 1) return false
  const d = docs[0]
  return Boolean(d?.blankStarter && !htmlToPlain(d.bodyHtml).trim())
}

function parsePlatformDocs(raw: string): PlatformDoc[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: PlatformDoc[] = []
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      if (!id) continue
      const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : 'Untitled'
      const bodyHtmlRaw = typeof r.bodyHtml === 'string' ? r.bodyHtml : ''
      const bodyHtml = coerceStoredEditorHtml(bodyHtmlRaw)
      const st = r.status
      const skRaw = r.sourceKind
      const sourceKind =
        typeof skRaw === 'string' && SOURCE_KINDS.has(skRaw as WorkspaceFolderFileKind)
          ? (skRaw as WorkspaceFolderFileKind)
          : undefined
      if (st === 'loading') {
        out.push({
          id,
          title,
          bodyHtml: '',
          status: 'error',
          error: 'Upload was interrupted — re-upload this file.',
          ...(sourceKind ? { sourceKind } : {}),
        })
        continue
      }
      if (st === 'error') {
        out.push({
          id,
          title,
          bodyHtml,
          status: 'error',
          error: typeof r.error === 'string' && r.error.trim() ? r.error.trim() : 'Could not read this file.',
          ...(sourceKind ? { sourceKind } : {}),
        })
        continue
      }
      const blankStarter = r.blankStarter === true
      out.push({
        id,
        title,
        bodyHtml,
        status: 'ready',
        ...(sourceKind ? { sourceKind } : {}),
        ...(blankStarter ? { blankStarter: true } : {}),
      })
    }
    return out
  } catch {
    return []
  }
}

function migrateLegacyDemoDocs(legacyRaw: string): PlatformDoc[] {
  try {
    const o = JSON.parse(legacyRaw) as Record<string, unknown>
    const order: [string, string][] = [
      ['one_pager', 'One-Pager'],
      ['pitch_deck', 'Pitch Deck'],
      ['financials', 'Financials'],
    ]
    const out: PlatformDoc[] = []
    for (const [id, title] of order) {
      const v = o[id]
      if (typeof v !== 'string' || !v.trim()) continue
      out.push({ id, title, bodyHtml: coerceStoredEditorHtml(v), status: 'ready' })
    }
    return out
  } catch {
    return []
  }
}

function loadDocsFromStorage(): PlatformDoc[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_PLATFORM_DOCS)
  if (raw !== null) {
    return parsePlatformDocs(raw)
  }
  const legacy = window.localStorage.getItem(STORAGE_LEGACY_DEMO_DOCS)
  if (!legacy) return []
  const migrated = migrateLegacyDemoDocs(legacy)
  if (migrated.length) {
    try {
      window.localStorage.setItem(STORAGE_PLATFORM_DOCS, JSON.stringify(migrated))
      window.localStorage.removeItem(STORAGE_LEGACY_DEMO_DOCS)
    } catch {
      /* ignore */
    }
  }
  return migrated
}

function loadClaimsFromStorage(): ClaimsStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_CLAIMS_GRAPH)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: ClaimsStore = {}
    for (const id of Object.keys(parsed as Record<string, unknown>)) {
      const row = (parsed as Record<string, unknown>)[id]
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const updatedAt = typeof r.updatedAt === 'string' ? r.updatedAt : ''
      const c = r.claims
      if (!c || typeof c !== 'object') continue
      const claims = emptyClaimsRecord()
      for (const k of CLAIM_KEYS) {
        const v = (c as Record<string, unknown>)[k]
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) claims[k] = v
        else claims[k] = null
      }
      const evRaw = r.evidence
      const evidence =
        evRaw && typeof evRaw === 'object' ? normalizeClaimEvidence(evRaw) : undefined
      if (updatedAt) {
        out[id] = evidence
          ? { claims, evidence, updatedAt }
          : { claims, updatedAt }
      }
    }
    return out
  } catch {
    return {}
  }
}

function pruneClaimsStore(store: ClaimsStore, docIds: Set<string>): ClaimsStore {
  const out: ClaimsStore = {}
  for (const id of docIds) {
    if (store[id]) out[id] = store[id]
  }
  return out
}

async function extractPdfTextOnServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/platform/extract-pdf', { method: 'POST', body: formData })
  const raw = await response.text()
  const contentType = response.headers.get('content-type') || ''
  let payload: { text?: string; error?: string } = {}
  if (contentType.includes('application/json')) {
    try {
      payload = JSON.parse(raw) as { text?: string; error?: string }
    } catch {
      throw new Error('PDF extract returned invalid JSON.')
    }
  } else if (raw.trimStart().startsWith('<')) {
    throw new Error('Server returned HTML instead of JSON for PDF extract.')
  } else {
    throw new Error(raw.slice(0, 200) || `PDF extract failed (${response.status}).`)
  }
  if (!response.ok) throw new Error(payload.error || `PDF extract failed (${response.status}).`)
  return (payload.text || '').trim()
}

async function extractDocxHtmlOnServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/platform/extract-docx', { method: 'POST', body: formData })
  const raw = await response.text()
  const contentType = response.headers.get('content-type') || ''
  let payload: { html?: string; error?: string } = {}
  if (contentType.includes('application/json')) {
    try {
      payload = JSON.parse(raw) as { html?: string; error?: string }
    } catch {
      throw new Error('DOCX extract returned invalid JSON.')
    }
  } else if (raw.trimStart().startsWith('<')) {
    throw new Error('Server returned HTML instead of JSON for DOCX extract.')
  } else {
    throw new Error(raw.slice(0, 200) || `DOCX extract failed (${response.status}).`)
  }
  if (!response.ok) throw new Error(payload.error || `DOCX extract failed (${response.status}).`)
  return (payload.html || '').trim()
}

async function extractPptxTextOnServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/platform/extract-pptx', { method: 'POST', body: formData })
  const raw = await response.text()
  const contentType = response.headers.get('content-type') || ''
  let payload: { text?: string; error?: string } = {}
  if (contentType.includes('application/json')) {
    try {
      payload = JSON.parse(raw) as { text?: string; error?: string }
    } catch {
      throw new Error('PPTX extract returned invalid JSON.')
    }
  } else if (raw.trimStart().startsWith('<')) {
    throw new Error('Server returned HTML instead of JSON for PPTX extract.')
  } else {
    throw new Error(raw.slice(0, 200) || `PPTX extract failed (${response.status}).`)
  }
  if (!response.ok) throw new Error(payload.error || `PPTX extract failed (${response.status}).`)
  return (payload.text || '').trim()
}

async function extractFileToHtml(
  file: File,
  kind: WorkspaceFolderFileKind
): Promise<{ html: string } | { error: string }> {
  try {
    if (kind === 'pdf') {
      const text = await extractPdfTextOnServer(file)
      if (!text.trim()) return { error: 'No extractable text in this PDF (try a text-based export).' }
      return { html: plainExtractToEditorHtml(text.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)) }
    }
    if (kind === 'text') {
      const text = await file.text()
      return { html: plainExtractToEditorHtml(text.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)) }
    }
    if (kind === 'markdown') {
      const text = await file.text()
      return { html: aiMarkdownToEditorHtml(text.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)) }
    }
    if (kind === 'docx') {
      const rawHtml = await extractDocxHtmlOnServer(file)
      const html = coerceStoredEditorHtml(rawHtml)
      const stripped = html.replace(/<[^>]+>/g, ' ')
      if (stripped.length > MAX_WORKSPACE_FOLDER_FILE_CHARS) {
        return {
          html: `${html.slice(0, Math.min(html.length, MAX_WORKSPACE_FOLDER_FILE_CHARS))}<p>…</p>`,
        }
      }
      return { html }
    }
    if (kind === 'pptx') {
      const text = await extractPptxTextOnServer(file)
      if (!text.trim()) return { error: 'No extractable text in this PPTX (try exporting with editable text).' }
      return { html: plainExtractToEditorHtml(text.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)) }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Extraction failed.' }
  }
  return { error: 'Unsupported file type.' }
}

export default function PlatformPage() {
  const router = useRouter()
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [docs, setDocs] = useState<PlatformDoc[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [claimsStore, setClaimsStore] = useState<ClaimsStore>({})
  const [crossDocPrefs, setCrossDocPrefs] = useState<CrossDocPrefsV1>(DEFAULT_CROSS_DOC_PREFS)
  const [agentPanelCollapsed, setAgentPanelCollapsed] = useState(true)
  const [extractStatus, setExtractStatus] = useState<string | null>(null)
  const hydratedRef = useRef(false)
  const extractTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docsRef = useRef<PlatformDoc[]>([])

  useEffect(() => {
    docsRef.current = docs
  }, [docs])

  useEffect(() => {
    return () => {
      for (const d of docsRef.current) {
        if (d.originalPreviewUrl) {
          try {
            URL.revokeObjectURL(d.originalPreviewUrl)
          } catch {
            /* ignore */
          }
        }
      }
    }
  }, [])

  const crossDocDismissed = useMemo(
    () => new Set(crossDocPrefs.dismissedIssueIds),
    [crossDocPrefs.dismissedIssueIds]
  )

  const docPlainById = useMemo(() => {
    const o: Record<string, string> = {}
    for (const d of docs) {
      if (d.status === 'ready') o[d.id] = htmlToPlain(d.bodyHtml)
    }
    return o
  }, [docs])

  const docTitleById = useMemo(() => {
    const o: Record<string, string> = {}
    for (const d of docs) o[d.id] = d.title
    return o
  }, [docs])

  const crossDocIssues = useMemo(
    () =>
      computeWorkspaceCrossDocIssues(claimsStore, {
        dismissedIds: crossDocDismissed,
        plainTextByDocId: docPlainById,
        docTitleById,
      }),
    [claimsStore, crossDocDismissed, docPlainById, docTitleById]
  )

  const issuesTouchingActiveDoc = useMemo(() => {
    if (!activeDocId) return []
    return crossDocIssues.filter((i) => i.sourceDocId === activeDocId || i.targetDocId === activeDocId)
  }, [crossDocIssues, activeDocId])

  const crossDocMarksForActive = useMemo(() => {
    if (!activeDocId) return []
    const doc = docs.find((d) => d.id === activeDocId)
    if (!doc || doc.status !== 'ready') return []
    return buildCrossDocEditorMarks({
      docId: activeDocId,
      issues: crossDocIssues,
      claimsStore,
      docTitleById,
    })
  }, [activeDocId, docs, crossDocIssues, claimsStore, docTitleById])

  const crossDocIssueCountByDocId = useMemo(() => {
    const m: Record<string, number> = {}
    for (const i of crossDocIssues) {
      if (i.sourceDocId === i.targetDocId) {
        m[i.sourceDocId] = (m[i.sourceDocId] ?? 0) + 1
      } else {
        m[i.sourceDocId] = (m[i.sourceDocId] ?? 0) + 1
        m[i.targetDocId] = (m[i.targetDocId] ?? 0) + 1
      }
    }
    return m
  }, [crossDocIssues])

  const dismissCrossDocIssue = useCallback((issueId: string) => {
    setCrossDocPrefs((prev) => ({
      ...prev,
      dismissedIssueIds: prev.dismissedIssueIds.includes(issueId)
        ? prev.dismissedIssueIds
        : [...prev.dismissedIssueIds, issueId],
    }))
  }, [])

  const clearDismissedCrossDoc = useCallback(() => {
    setCrossDocPrefs((prev) => ({ ...prev, dismissedIssueIds: [] }))
  }, [])

  const activeDoc = useMemo(
    () => (activeDocId ? docs.find((d) => d.id === activeDocId) ?? null : null),
    [activeDocId, docs]
  )

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
    if (hydratedRef.current) return
    hydratedRef.current = true
    let initialDocs = loadDocsFromStorage()
    if (initialDocs.length === 0) {
      initialDocs = [makeBlankStarterDoc()]
    }
    let initialClaims = loadClaimsFromStorage()
    initialClaims = pruneClaimsStore(initialClaims, new Set(initialDocs.map((d) => d.id)))
    setDocs(initialDocs)
    docsRef.current = initialDocs
    setClaimsStore(initialClaims)
    setCrossDocPrefs(loadCrossDocPrefs())
    const first = initialDocs.find((d) => d.status === 'ready') ?? initialDocs[0]
    if (first) setActiveDocId(first.id)

    void (async () => {
      for (const doc of initialDocs) {
        if (doc.status !== 'ready' || initialClaims[doc.id]) continue
        const plain = htmlToPlain(doc.bodyHtml)
        if (!plain) {
          setClaimsStore((prev) => ({
            ...prev,
            [doc.id]: {
              claims: emptyClaimsRecord(),
              evidence: emptyClaimEvidenceRecord(),
              updatedAt: new Date().toISOString(),
            },
          }))
          continue
        }
        try {
          const res = await fetch('/api/platform/extract-claims', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: plain }),
          })
          const data = (await res.json()) as { claims?: ClaimsRecord; evidence?: unknown }
          const claims = data.claims ?? emptyClaimsRecord()
          const evidence = normalizeClaimEvidence(data.evidence)
          setClaimsStore((prev) => ({
            ...prev,
            [doc.id]: { claims, evidence, updatedAt: new Date().toISOString() },
          }))
        } catch {
          setClaimsStore((prev) => ({
            ...prev,
            [doc.id]: {
              claims: emptyClaimsRecord(),
              evidence: emptyClaimEvidenceRecord(),
              updatedAt: new Date().toISOString(),
            },
          }))
        }
      }
    })()
  }, [])

  /** Drop stored figures that do not literally appear in the doc (fixes stale / hallucinated extractions). */
  useEffect(() => {
    if (!hydratedRef.current) return
    setClaimsStore((prev) => {
      let changed = false
      const next: ClaimsStore = { ...prev }
      for (const d of docs) {
        if (d.status !== 'ready') continue
        const e = prev[d.id]
        if (!e) continue
        const g = groundedClaimsAndEvidence(htmlToPlain(d.bodyHtml), e.claims, e.evidence)
        const sameClaims = CLAIM_KEYS.every((k) => e.claims[k] === g.claims[k])
        const sameEv = CLAIM_KEYS.every((k) => (e.evidence?.[k] ?? null) === g.evidence[k])
        if (sameClaims && sameEv) continue
        next[d.id] = { ...e, claims: g.claims, evidence: g.evidence, updatedAt: new Date().toISOString() }
        changed = true
      }
      return changed ? next : prev
    })
  }, [docs, claimsStore])

  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      const serializable = docs.map(({ originalPreviewUrl: _revokedBlob, ...rest }) => rest)
      window.localStorage.setItem(STORAGE_PLATFORM_DOCS, JSON.stringify(serializable))
    } catch {
      console.warn('Could not persist documents.')
    }
  }, [docs])

  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      window.localStorage.setItem(STORAGE_CLAIMS_GRAPH, JSON.stringify(claimsStore))
    } catch {
      console.warn('Could not persist claims graph.')
    }
  }, [claimsStore])

  useEffect(() => {
    if (!hydratedRef.current) return
    saveCrossDocPrefs(crossDocPrefs)
  }, [crossDocPrefs])

  useEffect(() => {
    if (activeDocId && !docs.some((d) => d.id === activeDocId)) {
      setActiveDocId(docs[0]?.id ?? null)
    }
  }, [activeDocId, docs])

  const runClaimsExtract = useCallback(async (docId: string, html: string) => {
    const plain = htmlToPlain(html)
    if (!plain) {
      setClaimsStore((prev) => ({
        ...prev,
        [docId]: {
          claims: emptyClaimsRecord(),
          evidence: emptyClaimEvidenceRecord(),
          updatedAt: new Date().toISOString(),
        },
      }))
      setExtractStatus(null)
      return
    }
    setExtractStatus('Extracting figures…')
    try {
      const res = await fetch('/api/platform/extract-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plain }),
      })
      const data = (await res.json()) as { claims?: ClaimsRecord; evidence?: unknown; error?: string }
      if (!res.ok) throw new Error(data.error || `Extract failed (${res.status})`)
      const claims = data.claims ?? emptyClaimsRecord()
      const evidence = normalizeClaimEvidence(data.evidence)
      setClaimsStore((prev) => ({
        ...prev,
        [docId]: { claims, evidence, updatedAt: new Date().toISOString() },
      }))
      setExtractStatus(null)
    } catch (e) {
      setExtractStatus(e instanceof Error ? e.message : 'Extract failed.')
    }
  }, [])

  const scheduleClaimsExtract = useCallback(
    (docId: string, html: string) => {
      if (extractTimerRef.current) window.clearTimeout(extractTimerRef.current)
      extractTimerRef.current = window.setTimeout(() => {
        extractTimerRef.current = null
        void runClaimsExtract(docId, html)
      }, 2000)
    },
    [runClaimsExtract]
  )

  /** Keep `claimsStore` aligned with the editor immediately; debounced API extract still refines. */
  const applyLiveHeuristicClaims = useCallback((docId: string, html: string) => {
    const plain = htmlToPlain(html)
    setClaimsStore((prev) => {
      if (!plain.trim()) {
        return {
          ...prev,
          [docId]: {
            claims: emptyClaimsRecord(),
            evidence: emptyClaimEvidenceRecord(),
            updatedAt: new Date().toISOString(),
          },
        }
      }
      const h = heuristicExtractClaimsWithEvidence(plain)
      const e = prev[docId]
      const baseClaims = e?.claims ?? emptyClaimsRecord()
      const baseEv = e?.evidence ?? emptyClaimEvidenceRecord()
      const mergedClaims = mergeClaimRecords(baseClaims, h.claims as Record<string, unknown>)
      const mergedEv = mergeClaimEvidence(baseEv, h.evidence)
      const g = groundedClaimsAndEvidence(plain, mergedClaims, mergedEv)
      return {
        ...prev,
        [docId]: {
          claims: g.claims,
          evidence: g.evidence,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [])

  const extractIntoDoc = useCallback(
    async (docId: string, file: File, kind: WorkspaceFolderFileKind) => {
      const result = await extractFileToHtml(file, kind)
      setDocs((prev) =>
        prev.map((d) => {
          if (d.id !== docId) return d
          if (d.originalPreviewUrl) {
            try {
              URL.revokeObjectURL(d.originalPreviewUrl)
            } catch {
              /* ignore */
            }
          }
          if ('error' in result) {
            return {
              ...d,
              status: 'error' as const,
              error: result.error,
              bodyHtml: '',
              sourceKind: kind,
              originalPreviewUrl: undefined,
            }
          }
          const originalPreviewUrl = kind === 'pdf' ? URL.createObjectURL(file) : undefined
          return {
            ...d,
            status: 'ready' as const,
            bodyHtml: result.html,
            error: undefined,
            sourceKind: kind,
            originalPreviewUrl,
          }
        })
      )
      if ('html' in result) {
        void runClaimsExtract(docId, result.html)
      }
    },
    [runClaimsExtract]
  )

  function openFilePicker() {
    const el = fileInputRef.current
    if (!el) return
    el.value = ''
    el.click()
  }

  function addBlankDocument() {
    if (docsRef.current.length >= MAX_PLATFORM_DOCS) {
      window.alert(`You can have at most ${MAX_PLATFORM_DOCS} documents. Remove one to add more.`)
      return
    }
    const doc = makeBlankDocument()
    const next = [...docsRef.current, doc]
    setDocs(next)
    docsRef.current = next
    setActiveDocId(doc.id)
    const now = new Date().toISOString()
    setClaimsStore((prev) => ({
      ...prev,
      [doc.id]: {
        claims: emptyClaimsRecord(),
        evidence: emptyClaimEvidenceRecord(),
        updatedAt: now,
      },
    }))
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const list = input.files
    if (!list?.length) return
    /** Snapshot before clearing `value` — some browsers empty `FileList` after reset. */
    const files = Array.from(list)
    input.value = ''

    const prevRaw = docsRef.current
    const base = isEmptyStarterOnly(prevRaw) ? [] : prevRaw
    const room = MAX_PLATFORM_DOCS - base.length
    if (room <= 0) {
      window.alert(`You can have at most ${MAX_PLATFORM_DOCS} documents. Remove one to add more.`)
      return
    }

    const picked: PendingExtraction[] = []
    for (const file of files) {
      if (picked.length >= room) break
      const kind = classifyWorkspaceFile(file)
      if (!kind) continue
      picked.push({
        id: crypto.randomUUID(),
        file,
        kind,
      })
    }
    if (!picked.length) {
      window.alert(
        'No supported files in that selection. Use PDF, Word (.docx), PowerPoint (.pptx), Markdown, or plain text. Legacy .ppt is not supported — save as .pptx in PowerPoint first.'
      )
      return
    }

    const newRows: PlatformDoc[] = picked.map((p) => ({
      id: p.id,
      title: p.file.name || 'Untitled',
      bodyHtml: '',
      status: 'loading',
    }))

    const nextDocs = [...base, ...newRows]
    flushSync(() => {
      setDocs(nextDocs)
    })
    docsRef.current = nextDocs
    setActiveDocId(picked[0]!.id)
    /** Defer extraction until after React commits the new doc rows (flushSync already committed). */
    window.setTimeout(() => {
      for (const p of picked) {
        void extractIntoDoc(p.id, p.file, p.kind)
      }
    }, 0)
  }

  function removeDoc(docId: string) {
    const victim = docsRef.current.find((d) => d.id === docId)
    if (victim?.originalPreviewUrl) {
      try {
        URL.revokeObjectURL(victim.originalPreviewUrl)
      } catch {
        /* ignore */
      }
    }
    const next = docsRef.current.filter((d) => d.id !== docId)
    setClaimsStore((prev) => {
      const out = { ...prev }
      delete out[docId]
      return out
    })
    if (next.length === 0) {
      const starter = makeBlankStarterDoc()
      setDocs([starter])
      setActiveDocId(starter.id)
      docsRef.current = [starter]
      return
    }
    setDocs(next)
    docsRef.current = next
    if (activeDocId === docId) {
      const pick = next.find((d) => d.status === 'ready') ?? next[0]
      setActiveDocId(pick?.id ?? null)
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const agentChatContext = useMemo(() => {
    const maxPer = 7000
    const parts: string[] = []
    for (const d of docs) {
      if (d.status !== 'ready') continue
      const plain = htmlToPlain(d.bodyHtml).trim()
      if (!plain) continue
      const body = plain.length > maxPer ? `${plain.slice(0, maxPer)}\n… (truncated)` : plain
      parts.push(`=== Document: ${d.title} ===\n${body}`)
    }
    if (!parts.length) {
      return 'No extracted document text in this workspace yet. Upload files and wait for extraction, then ask again.'
    }
    return parts.join('\n\n---\n\n')
  }, [docs])

  const agentDocuments = useMemo(() => docs.map((d) => ({ id: d.id, name: d.title })), [docs])

  return (
    <main className="notion-page notion-page--claims-demo">
      <PlatformTopBar
        supabaseConfigured={isSupabaseConfigured()}
        accountEmail={accountEmail}
        onSignOut={signOut}
      />
      <div
        className={['notion-shell', !agentPanelCollapsed ? 'notion-shell--with-agent' : ''].filter(Boolean).join(' ')}
      >
        <aside className="notion-sidebar" aria-label="Sidebar">
          <div className="notion-sidebar-brand-row">
            <div className="notion-sidebar-brand">Workspace</div>
          </div>

          <div className="notion-sidebar-docs">
            <input
              ref={fileInputRef}
              type="file"
              className="notion-sidebar-folder-input-hidden"
              tabIndex={-1}
              aria-hidden
              multiple
              accept=".pdf,.docx,.dotx,.pptx,.txt,.text,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown"
              onChange={onFilesSelected}
            />
            <div className="notion-sidebar-docs-head">
              <span className="notion-sidebar-docs-label">Documents</span>
              <div className="notion-sidebar-docs-actions">
                <button
                  type="button"
                  className="notion-sidebar-add-doc"
                  onClick={addBlankDocument}
                  title="New blank document"
                  aria-label="New blank document"
                >
                  +
                </button>
                <button
                  type="button"
                  className="notion-sidebar-upload-files"
                  onClick={openFilePicker}
                  title="Upload files (PDF, Word, PowerPoint .pptx, Markdown, or plain text). You can add many at once."
                  aria-label="Upload files"
                >
                  <svg
                    className="notion-sidebar-upload-files-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="17 8 12 3 7 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {docs.length === 0 ? (
              <p className="notion-sidebar-upload-hint">Loading workspace…</p>
            ) : (
              docs.map((doc) => {
                return (
                  <div key={doc.id} className="notion-sidebar-doc-row">
                    <button
                      type="button"
                      className={`notion-sidebar-item notion-sidebar-doc-item ${
                        activeDocId === doc.id ? 'is-active' : ''
                      }`}
                      onClick={() => setActiveDocId(doc.id)}
                    >
                      <span className="notion-sidebar-doc-item-label" title={doc.title}>
                        {doc.title}
                        {doc.status === 'loading' ? ' …' : ''}
                      </span>
                      {(crossDocIssueCountByDocId[doc.id] ?? 0) > 0 ? (
                        <span
                          className="notion-sidebar-doc-flag-badge"
                          title="Open workspace flags — highlighted in the editor when you select this file"
                        >
                          {crossDocIssueCountByDocId[doc.id]}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      className="notion-sidebar-doc-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeDoc(doc.id)
                      }}
                      aria-label={`Remove ${doc.title}`}
                      title="Remove from workspace"
                    >
                      ×
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <div className="notion-main notion-main--demo">
          {!activeDoc ? (
            <article className="notion-doc notion-doc--boot" aria-busy="true">
              <p className="notion-uploaded-status">Loading workspace…</p>
            </article>
          ) : activeDoc.status === 'loading' ? (
            <article className="notion-doc" aria-label={activeDoc.title}>
              <h1 className="notion-demo-doc-title">{activeDoc.title}</h1>
              <p className="notion-uploaded-status">Extracting text…</p>
            </article>
          ) : activeDoc.status === 'error' ? (
            <article className="notion-doc" aria-label={activeDoc.title}>
              <h1 className="notion-demo-doc-title">{activeDoc.title}</h1>
              <p className="notion-uploaded-error" role="alert">
                {activeDoc.error || 'Could not read this file.'}
              </p>
            </article>
          ) : (
            <article
              className={[
                'notion-doc',
                activeDoc.sourceKind === 'docx' ? 'notion-doc--imported-docx' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={activeDoc.title}
            >
              <input
                type="text"
                className="notion-demo-doc-title notion-demo-doc-title-input"
                value={activeDoc.title}
                aria-label="Document name"
                onChange={(e) => {
                  const v = e.target.value
                  setDocs((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, title: v } : d)))
                }}
                onBlur={(e) => {
                  const t = e.target.value.trim() || 'Untitled'
                  setDocs((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, title: t } : d)))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
              />
              {extractStatus ? <p className="notion-demo-extract-status">{extractStatus}</p> : null}
              {activeDoc.originalPreviewUrl ? (
                <OriginalPdfPreview url={activeDoc.originalPreviewUrl} docTitle={activeDoc.title} />
              ) : activeDoc.sourceKind === 'pdf' ? (
                <p className="notion-original-preview-reload-hint">
                  Original PDF layout is available right after upload in a new session. Reload cleared the preview;
                  re-upload the file to see it again alongside extracted text.
                </p>
              ) : null}
              <RichDocEditor
                value={activeDoc.bodyHtml}
                onChange={(html) => {
                  setDocs((prev) =>
                    prev.map((d) => {
                      if (d.id !== activeDoc.id) return d
                      const hasText = Boolean(htmlToPlain(html).trim())
                      return {
                        ...d,
                        bodyHtml: html,
                        ...(d.blankStarter && hasText ? { blankStarter: false } : {}),
                      }
                    })
                  )
                  applyLiveHeuristicClaims(activeDoc.id, html)
                  scheduleClaimsExtract(activeDoc.id, html)
                }}
                placeholder={
                  activeDoc.blankStarter && !htmlToPlain(activeDoc.bodyHtml).trim()
                    ? 'Or start typing here — uploads from + in the sidebar add extracted documents alongside this note.'
                    : 'Edit extracted text. Figures refresh per document after a short pause.'
                }
                crossDocMarks={crossDocMarksForActive}
                crossDocIssuesInDoc={issuesTouchingActiveDoc}
                viewerDocId={activeDoc.id}
                docTitleById={docTitleById}
                onOpenWorkspaceDoc={(id) => setActiveDocId(id)}
                onDismissCrossDocIssue={dismissCrossDocIssue}
                onRestoreDismissedCrossDoc={clearDismissedCrossDoc}
                crossDocDismissedCount={crossDocPrefs.dismissedIssueIds.length}
              />
            </article>
          )}
        </div>

        {!agentPanelCollapsed ? (
          <PlatformAgentPanel
            context={agentChatContext}
            documents={agentDocuments}
            activeDocId={activeDocId}
            ragEnabled={isSupabaseConfigured() && !!accountEmail}
            onClose={() => setAgentPanelCollapsed(true)}
          />
        ) : null}
      </div>
      {agentPanelCollapsed ? <AgentOpenFab onOpen={() => setAgentPanelCollapsed(false)} /> : null}
    </main>
  )
}
