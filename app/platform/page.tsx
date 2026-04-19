'use client'

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { flushSync } from 'react-dom'
import { OriginalPdfPreview } from '@/components/platform/OriginalPdfPreview'
import { RichDocEditor } from '@/components/platform/RichDocEditor'
import { aiMarkdownToEditorHtml, coerceStoredEditorHtml } from '@/components/platform/editorHtml'
import {
  appendDataLineageEvent,
  formatLineageDisplayTime,
  LINEAGE_KIND_LABEL,
  loadDataLineageEvents,
  type LineageEvent,
} from '@/lib/platform/dataLineage'
import {
  claimValuesDiffer,
  conflictCountForDoc,
  detectClaimConflictGroups,
  type ClaimsStore,
  type StoredDocClaims,
} from '@/lib/platform/claimsConflict'
import { filterConflictGroupsDeterministic } from '@/lib/platform/deterministicConflictFilter'
import { surfaceStringsToHighlightClaim } from '@/lib/platform/claimSurfaceStrings'
import { groundedClaimsAndEvidence } from '@/lib/platform/claimsGrounding'
import { formatClaimValue } from '@/lib/platform/claimsDisplay'
import {
  CLAIM_KEYS,
  CLAIM_LABEL,
  emptyClaimEvidenceRecord,
  emptyClaimsRecord,
  normalizeClaimEvidence,
  type ClaimEvidenceRecord,
  type ClaimKey,
  type ClaimsRecord,
} from '@/lib/platform/claimsSchema'
import { pickScrollPhraseInPlainDoc } from '@/lib/platform/pickScrollPhraseForClaim'
import { appendSyncFootnote, patchClaimInHtml } from '@/lib/platform/patchClaimInHtml'
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
}

type PendingExtraction = { id: string; file: File; kind: WorkspaceFolderFileKind }

function htmlToPlain(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
      out.push({ id, title, bodyHtml, status: 'ready', ...(sourceKind ? { sourceKind } : {}) })
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
  const [lineageEvents, setLineageEvents] = useState<LineageEvent[]>([])
  const [conflictPanelOpen, setConflictPanelOpen] = useState(false)
  const [expandedConflictId, setExpandedConflictId] = useState<string | null>(null)
  const [scrollConflict, setScrollConflict] = useState<{
    docId: string
    phrase: string
    token: number
  } | null>(null)
  const [syncSourcePickerOpen, setSyncSourcePickerOpen] = useState(false)
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

  const docTitle = useCallback(
    (id: string | undefined) =>
      docs.find((d) => d.id === id)?.title ?? (id && id.length > 0 ? id.slice(0, 8) : 'Document'),
    [docs]
  )

  const clearScrollConflict = useCallback(() => {
    setScrollConflict(null)
  }, [])

  const openConflictInDoc = useCallback((docId: string, key: ClaimKey, value: number) => {
    const d = docsRef.current.find((x) => x.id === docId && x.status === 'ready')
    const plain = d ? htmlToPlain(d.bodyHtml) : ''
    const picked = pickScrollPhraseInPlainDoc(plain, key, value)
    const phrase = picked ?? formatClaimValue(key, value)
    setActiveDocId(docId)
    setScrollConflict((prev) => ({
      docId,
      phrase,
      token: (prev?.token ?? 0) + 1,
    }))
  }, [])

  const rawConflictGroups = useMemo(() => detectClaimConflictGroups(claimsStore), [claimsStore])
  const conflicts = useMemo(
    () => filterConflictGroupsDeterministic(rawConflictGroups, claimsStore),
    [rawConflictGroups, claimsStore]
  )

  useEffect(() => {
    if (scrollConflict && activeDocId !== scrollConflict.docId) {
      setScrollConflict(null)
    }
  }, [activeDocId, scrollConflict])

  const activeDoc = useMemo(
    () => (activeDocId ? docs.find((d) => d.id === activeDocId) ?? null : null),
    [activeDocId, docs]
  )

  /** Literal substrings in the open doc that participate in a cross-doc conflict (for red underlines). */
  const conflictHighlightPhrases = useMemo(() => {
    if (!activeDocId) return []
    const phrases = new Set<string>()
    for (const g of conflicts) {
      const row = g.docs.find((d) => d.docId === activeDocId)
      if (!row) continue
      for (const s of surfaceStringsToHighlightClaim(g.key, row.value)) {
        phrases.add(s)
      }
    }
    return [...phrases].sort((a, b) => b.length - a.length)
  }, [conflicts, activeDocId])

  const refreshLineage = useCallback(() => {
    setLineageEvents(loadDataLineageEvents().filter((e) => e.kind === 'cross_doc_claim_synced').slice(0, 12))
  }, [])

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
    const initialDocs = loadDocsFromStorage()
    let initialClaims = loadClaimsFromStorage()
    initialClaims = pruneClaimsStore(initialClaims, new Set(initialDocs.map((d) => d.id)))
    setDocs(initialDocs)
    setClaimsStore(initialClaims)
    if (initialDocs.length) {
      const first = initialDocs.find((d) => d.status === 'ready') ?? initialDocs[0]
      setActiveDocId(first.id)
    }
    refreshLineage()

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
  }, [refreshLineage])

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
    if (activeDocId && !docs.some((d) => d.id === activeDocId)) {
      setActiveDocId(docs[0]?.id ?? null)
    }
  }, [activeDocId, docs])

  useEffect(() => {
    if (conflicts.length > 0) setConflictPanelOpen(true)
  }, [conflicts.length])

  useEffect(() => {
    if (!syncSourcePickerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSyncSourcePickerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [syncSourcePickerOpen])

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

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const list = input.files
    if (!list?.length) return
    /** Snapshot before clearing `value` — some browsers empty `FileList` after reset. */
    const files = Array.from(list)
    input.value = ''

    const prev = docsRef.current
    const room = MAX_PLATFORM_DOCS - prev.length
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

    const nextDocs = [...prev, ...newRows]
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
    setDocs((prev) => prev.filter((d) => d.id !== docId))
    setClaimsStore((prev) => {
      const next = { ...prev }
      delete next[docId]
      return next
    })
    if (activeDocId === docId) {
      setActiveDocId(null)
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function syncEverywhereFromDoc(sourceDocId: string) {
    const truthEntry = claimsStore[sourceDocId]
    if (!truthEntry) return
    const truth = truthEntry.claims
    const truthEv = truthEntry.evidence ?? emptyClaimEvidenceRecord()

    const nextBodies: Record<string, string> = Object.fromEntries(docs.map((d) => [d.id, d.bodyHtml]))
    const nextClaims: ClaimsStore = { ...claimsStore }
    const lineageChanges: string[] = []
    const affectedTitles = new Set<string>()
    const updatedBodyIds = new Set<string>()

    for (const doc of docs) {
      if (doc.id === sourceDocId || doc.status !== 'ready') continue
      let html = nextBodies[doc.id] ?? doc.bodyHtml
      const prevEntry: StoredDocClaims = nextClaims[doc.id] ?? {
        claims: emptyClaimsRecord(),
        evidence: emptyClaimEvidenceRecord(),
        updatedAt: new Date().toISOString(),
      }
      const merged = { ...prevEntry.claims }
      const mergedEv: ClaimEvidenceRecord = {
        ...(prevEntry.evidence ?? emptyClaimEvidenceRecord()),
      }
      const foot: { label: string; from: string; to: string }[] = []

      for (const key of CLAIM_KEYS) {
        const t = truth[key]
        const v = merged[key]
        if (t === null || v === null) continue
        if (!claimValuesDiffer(key, t, v)) continue
        html = patchClaimInHtml(html, key, v, t)
        merged[key] = t
        const evT = truthEv[key]
        if (evT) mergedEv[key] = evT
        foot.push({
          label: CLAIM_LABEL[key],
          from: formatClaimValue(key, v),
          to: formatClaimValue(key, t),
        })
      }

      if (foot.length) {
        nextBodies[doc.id] = coerceStoredEditorHtml(appendSyncFootnote(html, foot))
        nextClaims[doc.id] = { claims: merged, evidence: mergedEv, updatedAt: new Date().toISOString() }
        updatedBodyIds.add(doc.id)
        affectedTitles.add(doc.title)
        for (const row of foot) {
          lineageChanges.push(`${row.label} synced: ${row.from} → ${row.to}`)
        }
      }
    }

    if (affectedTitles.size === 0) return

    setDocs((prev) =>
      prev.map((d) =>
        updatedBodyIds.has(d.id) ? { ...d, bodyHtml: nextBodies[d.id]!, status: 'ready' as const } : d
      )
    )
    setClaimsStore(nextClaims)

    appendDataLineageEvent({
      kind: 'cross_doc_claim_synced',
      summary: `Cross-doc sync applied to ${[...affectedTitles].join(', ')}`,
      detail: `Source: Cross-doc sync · numbers taken from ${docTitle(sourceDocId)}`,
      changes: [
        ...lineageChanges.slice(0, 12),
        `Source document: ${docTitle(sourceDocId)}`,
        `Affected: ${[...affectedTitles].join(', ')}`,
      ],
    })
    refreshLineage()
    setSyncSourcePickerOpen(false)
  }

  const readyDocs = useMemo(() => docs.filter((d) => d.status === 'ready'), [docs])

  return (
    <main className="notion-page notion-page--claims-demo">
      <div className="notion-shell notion-shell--with-conflict-dock">
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
                <button
                  type="button"
                  className="notion-sidebar-sign-out"
                  onClick={() => void signOut()}
                  aria-label="Sign out"
                >
                  <svg
                    className="notion-sidebar-sign-out-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
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
                  onClick={openFilePicker}
                  title="Upload documents (PDF, Word, PowerPoint .pptx, Markdown, or plain text). You can add many at once."
                  aria-label="Upload documents"
                >
                  +
                </button>
              </div>
            </div>
            {docs.length === 0 ? (
              <p className="notion-sidebar-upload-hint">Use + to upload one or more files.</p>
            ) : (
              docs.map((doc) => {
                const n = conflictCountForDoc(conflicts, doc.id)
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
                      {n > 0 ? (
                        <span className="notion-conflict-badge" aria-label={`${n} conflicts`}>
                          {n}
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
          <header className="notion-demo-hero">
            <p className="notion-demo-hero-line">
              Your financial numbers lie to investors because they&apos;re inconsistent across documents. We fix that
              automatically.
            </p>
          </header>

          {!activeDoc || docs.length === 0 ? (
            <article className="notion-doc notion-doc--empty-upload" aria-label="Getting started">
              <div className="notion-deck-empty">
                <p>Upload your documents (as many as you need — up to {MAX_PLATFORM_DOCS}).</p>
                <p className="notion-deck-empty-sub">
                  PDF, Word (.docx), and PowerPoint (.pptx) are supported. Legacy .ppt is not — save as .pptx first. We
                  extract text, detect figure conflicts, and sync from the doc you trust.
                </p>
                <button type="button" className="notion-empty-upload-cta" onClick={openFilePicker}>
                  Choose files
                </button>
              </div>
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
              <h1 className="notion-demo-doc-title">{activeDoc.title}</h1>
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
                  setDocs((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, bodyHtml: html } : d)))
                  applyLiveHeuristicClaims(activeDoc.id, html)
                  scheduleClaimsExtract(activeDoc.id, html)
                }}
                placeholder="Edit extracted text. Figures are compared across all uploaded documents after a short pause."
                conflictHighlightPhrases={conflictHighlightPhrases}
                scrollToConflict={
                  scrollConflict && activeDocId === scrollConflict.docId
                    ? { phrase: scrollConflict.phrase, token: scrollConflict.token }
                    : null
                }
                onScrollToConflictComplete={clearScrollConflict}
              />
            </article>
          )}

          {lineageEvents.length > 0 ? (
            <section className="notion-demo-lineage" aria-label="Sync activity">
              <h2 className="notion-demo-lineage-title">Accountability trail</h2>
              <ol className="notion-demo-lineage-list">
                {lineageEvents.map((ev) => (
                  <li key={ev.id} className="notion-demo-lineage-row">
                    <span className="notion-demo-lineage-badge">{LINEAGE_KIND_LABEL[ev.kind]}</span>
                    <time className="notion-demo-lineage-time" dateTime={ev.ts}>
                      {formatLineageDisplayTime(ev.ts)}
                    </time>
                    <p className="notion-demo-lineage-summary">{ev.summary}</p>
                    {ev.detail ? <p className="notion-demo-lineage-detail">{ev.detail}</p> : null}
                    {ev.changes?.length ? (
                      <ul className="notion-demo-lineage-changes">
                        {ev.changes.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside
          className={`notion-conflict-dock ${conflictPanelOpen ? 'is-open' : ''}`}
          aria-hidden={!conflictPanelOpen}
        >
          <div className="notion-conflict-dock-head">
            <h2 className="notion-conflict-dock-title">Live conflicts</h2>
            <button
              type="button"
              className="notion-conflict-dock-close"
              onClick={() => setConflictPanelOpen(false)}
              aria-label="Close conflict panel"
            >
              ×
            </button>
          </div>
          {docs.length < 2 ? (
            <p className="notion-conflict-dock-empty">Upload at least two documents to compare figures across files.</p>
          ) : conflicts.length === 0 ? (
            <p className="notion-conflict-dock-empty">
              {rawConflictGroups.length > 0
                ? `No conflicts shown (${rawConflictGroups.length} raw cluster${rawConflictGroups.length === 1 ? '' : 's'} filtered by stable rules — likely different metrics or bad extractions).`
                : 'No figure conflicts across your uploaded documents.'}
            </p>
          ) : (
            <>
              <p className="notion-conflict-dock-lead">
                ⚠️ {conflicts.length} mismatch{conflicts.length === 1 ? '' : 'es'} after stable checks (same result on
                refresh).{' '}
                {rawConflictGroups.length > conflicts.length ? (
                  <>
                    {rawConflictGroups.length - conflicts.length} raw cluster
                    {rawConflictGroups.length - conflicts.length === 1 ? '' : 's'} hidden as likely false positives.
                  </>
                ) : null}{' '}
                Sync picks one document you trust, then aligns the others.
              </p>
              <ul className="notion-conflict-dock-list">
                {conflicts.map((g, idx) => {
                  const rowId = `${g.key}-${g.docs.map((d) => d.docId).sort().join('+')}-${idx}`
                  const expanded = expandedConflictId === rowId
                  const summary = g.docs
                    .map((d) => `${docTitle(d.docId)} ${formatClaimValue(g.key, d.value)}`)
                    .join(' · ')
                  return (
                    <li key={rowId} className="notion-conflict-dock-row">
                      <button
                        type="button"
                        className="notion-conflict-dock-row-toggle"
                        aria-expanded={expanded}
                        onClick={() => setExpandedConflictId((cur) => (cur === rowId ? null : rowId))}
                      >
                        <strong>{CLAIM_LABEL[g.key]}</strong>
                        <span className="notion-conflict-dock-values">
                          {g.docs.length} files disagree — {summary}
                        </span>
                        <span className="notion-conflict-dock-row-hint">{expanded ? 'Hide' : 'Show'} files</span>
                      </button>
                      {expanded ? (
                        <ul className="notion-conflict-dock-file-list" aria-label="Open location in document">
                          {g.docs.map((d) => (
                            <li key={d.docId}>
                              <button
                                type="button"
                                className="notion-conflict-dock-file-btn"
                                onClick={() => openConflictInDoc(d.docId, g.key, d.value)}
                              >
                                <span className="notion-conflict-dock-file-name">{docTitle(d.docId)}</span>
                                <span className="notion-conflict-dock-file-val">{formatClaimValue(g.key, d.value)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              <button type="button" className="notion-conflict-sync-all" onClick={() => setSyncSourcePickerOpen(true)}>
                Sync everywhere
              </button>
            </>
          )}
        </aside>

        {conflicts.length > 0 && !conflictPanelOpen ? (
          <button
            type="button"
            className="notion-conflict-fab"
            onClick={() => setConflictPanelOpen(true)}
            aria-label="Show conflicts"
          >
            {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'}
          </button>
        ) : null}

        {syncSourcePickerOpen ? (
          <div
            className="notion-sync-source-overlay"
            role="presentation"
            onClick={() => setSyncSourcePickerOpen(false)}
          >
            <div
              className="notion-sync-source-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sync-source-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="sync-source-title" className="notion-sync-source-title">
                Which document has the right numbers?
              </h2>
              <p className="notion-sync-source-sub">
                We&apos;ll copy matching figures from that doc into the others and log it in the accountability trail.
              </p>
              <div className="notion-sync-source-actions" role="group" aria-label="Choose source document">
                {readyDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className="notion-sync-source-choice"
                    onClick={() => syncEverywhereFromDoc(doc.id)}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
              <button type="button" className="notion-sync-source-cancel" onClick={() => setSyncSourcePickerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
