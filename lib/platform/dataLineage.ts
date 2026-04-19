export const DATA_LINEAGE_STORAGE_KEY = 'platform_data_lineage_v1'

const MAX_EVENTS = 400

export type LineageKind =
  | 'session_start'
  | 'tab_nav'
  | 'document_opened'
  | 'blank_doc_created'
  | 'workspace_folder_imported'
  | 'workspace_folder_removed'
  | 'pitch_pdf_uploaded'
  | 'embedded_deck_saved'
  | 'one_pager_generated'
  | 'smart_fill_applied'
  | 'one_pager_saved'
  | 'one_pager_title'
  | 'one_pager_layout'
  | 'financials_saved'
  | 'traction_saved'
  | 'market_sizing_saved'
  | 'market_competitive_saved'
  | 'product_roadmap_saved'
  | 'team_workspace_saved'
  | 'deck_text_saved'
  | 'blank_docs_saved'
  | 'workspace_file_edited'
  | 'lineage_cleared'

const MAX_CHANGE_LINES = 24

export type LineageEvent = {
  id: string
  ts: string
  kind: LineageKind
  summary: string
  detail?: string
  /** Human-readable bullets describing what changed (field deltas, length, etc.). */
  changes?: string[]
}

export type LineageAppendInput = Omit<LineageEvent, 'id' | 'ts'>

export const LINEAGE_KIND_LABEL: Record<LineageKind, string> = {
  session_start: 'Session',
  tab_nav: 'Navigation',
  document_opened: 'Document',
  blank_doc_created: 'Document',
  workspace_folder_imported: 'Workspace',
  workspace_folder_removed: 'Workspace',
  pitch_pdf_uploaded: 'Pitch deck',
  embedded_deck_saved: 'Pitch deck',
  one_pager_generated: 'AI',
  smart_fill_applied: 'AI',
  one_pager_saved: 'One pager',
  one_pager_title: 'One pager',
  one_pager_layout: 'One pager',
  financials_saved: 'Financials',
  traction_saved: 'Traction',
  market_sizing_saved: 'Market',
  market_competitive_saved: 'Market',
  product_roadmap_saved: 'Product',
  team_workspace_saved: 'Team',
  deck_text_saved: 'Pitch deck',
  blank_docs_saved: 'Documents',
  workspace_file_edited: 'Document',
  lineage_cleared: 'Lineage',
}

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

export function loadDataLineageEvents(): LineageEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(DATA_LINEAGE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: LineageEvent[] = []
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      const ts = typeof r.ts === 'string' ? r.ts : ''
      const kind = r.kind as LineageKind
      const summary = typeof r.summary === 'string' ? r.summary : ''
      if (!id || !ts || !summary) continue
      if (!(kind in LINEAGE_KIND_LABEL)) continue
      let changes: string[] | undefined
      if (Array.isArray(r.changes)) {
        const raw = r.changes.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
        if (raw.length) changes = raw.slice(0, MAX_CHANGE_LINES)
      }
      out.push({
        id,
        ts,
        kind,
        summary,
        detail: typeof r.detail === 'string' && r.detail.trim() ? r.detail.trim() : undefined,
        changes,
      })
    }
    return out
  } catch {
    return []
  }
}

export function appendDataLineageEvent(input: LineageAppendInput): LineageEvent {
  const trimmedChanges = input.changes?.length
    ? input.changes.map((s) => s.trim()).filter(Boolean).slice(0, MAX_CHANGE_LINES)
    : undefined
  const event: LineageEvent = {
    id: newId(),
    ts: new Date().toISOString(),
    ...input,
    changes: trimmedChanges?.length ? trimmedChanges : undefined,
  }
  if (typeof window === 'undefined') return event
  try {
    const prev = loadDataLineageEvents()
    const next = [event, ...prev].slice(0, MAX_EVENTS)
    window.localStorage.setItem(DATA_LINEAGE_STORAGE_KEY, JSON.stringify(next))
  } catch {
    console.warn('Data lineage: could not persist event (storage full?)')
  }
  return event
}

export function clearDataLineageEvents(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(DATA_LINEAGE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function formatLineageDisplayTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(d)
  } catch {
    return iso
  }
}
