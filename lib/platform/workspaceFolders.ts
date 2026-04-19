export type WorkspaceFolderFileKind = 'pdf' | 'text' | 'markdown' | 'docx' | 'pptx'

export type WorkspaceFolderFileStatus = 'pending' | 'loading' | 'ready' | 'error'

export type WorkspaceFolderFile = {
  id: string
  relPath: string
  displayName: string
  kind: WorkspaceFolderFileKind
  bodyHtml: string
  status: WorkspaceFolderFileStatus
  error?: string
}

export type WorkspaceFolder = {
  id: string
  label: string
  createdAt: string
  files: WorkspaceFolderFile[]
}

export const MAX_WORKSPACE_FILES_PER_FOLDER = 40
export const MAX_WORKSPACE_FOLDER_FILE_CHARS = 48_000

const SKIP_NAME = /^(\.DS_Store|Thumbs\.db)$/i
const SKIP_PREFIX = /^__MACOSX\//

export function shouldSkipWorkspacePath(relPath: string): boolean {
  const n = relPath.replace(/\\/g, '/')
  if (!n.trim()) return true
  if (SKIP_PREFIX.test(n)) return true
  const base = n.split('/').pop() || n
  if (SKIP_NAME.test(base)) return true
  // Word / Office lock files when a document is open (~$Name.docx)
  if (base.startsWith('~$')) return true
  return false
}

export function classifyWorkspaceFilename(name: string): WorkspaceFolderFileKind | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx') || lower.endsWith('.dotx')) return 'docx'
  if (lower.endsWith('.pptx')) return 'pptx'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
  if (lower.endsWith('.txt') || lower.endsWith('.text')) return 'text'
  return null
}

/** Prefer this for folder picks: browsers often leave `File.type` empty for some DOCX paths. */
export function classifyWorkspaceFile(file: File): WorkspaceFolderFileKind | null {
  const name = (file.name || '').toLowerCase()
  const mime = (file.type || '').toLowerCase()
  if (name.endsWith('.pdf') || mime === 'application/pdf' || mime === 'application/x-pdf') return 'pdf'
  if (
    name.endsWith('.docx') ||
    name.endsWith('.dotx') ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
  ) {
    return 'docx'
  }
  if (
    name.endsWith('.pptx') ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'pptx'
  }
  if (name.endsWith('.md') || name.endsWith('.markdown') || mime === 'text/markdown') return 'markdown'
  if (name.endsWith('.txt') || name.endsWith('.text') || mime === 'text/plain') return 'text'
  return null
}

export function defaultFolderLabelFromFileList(files: File[]): string {
  for (const f of files) {
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || ''
    if (rel.includes('/')) {
      const top = rel.split('/')[0]
      if (top && !SKIP_NAME.test(top)) return top
    }
  }
  return 'Imported folder'
}

/** Escape plain text into simple HTML paragraphs (good for PDF extract). */
export function plainExtractToEditorHtml(text: string, maxChars = MAX_WORKSPACE_FOLDER_FILE_CHARS): string {
  const raw = text.length > maxChars ? `${text.slice(0, maxChars)}\n\n[Truncated]` : text
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const blocks = raw.split(/\n{2,}/)
  const html = blocks
    .map((block) => {
      const inner = esc(block).replace(/\n/g, '<br/>')
      return `<p>${inner || '<br/>'}</p>`
    })
    .join('')
  return html || '<p></p>'
}

function normalizeHydratedFile(f: WorkspaceFolderFile): WorkspaceFolderFile {
  if (f.status === 'pending' || f.status === 'loading') {
    return {
      ...f,
      status: 'error',
      error: 'Extraction was interrupted (reload). Remove this folder and upload again.',
    }
  }
  return f
}

export function parseWorkspaceFolders(raw: string | null): WorkspaceFolder[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: WorkspaceFolder[] = []
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      if (!id) continue
      const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim() : 'Folder'
      const createdAt = typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString()
      const filesRaw = r.files
      if (!Array.isArray(filesRaw)) continue
      const files: WorkspaceFolderFile[] = []
      for (const fr of filesRaw) {
        if (!fr || typeof fr !== 'object') continue
        const x = fr as Record<string, unknown>
        const fid = typeof x.id === 'string' ? x.id : ''
        if (!fid) continue
        const relPath = typeof x.relPath === 'string' ? x.relPath : ''
        const displayName = typeof x.displayName === 'string' ? x.displayName : relPath || 'File'
        const kind = x.kind as WorkspaceFolderFileKind
        if (
          kind !== 'pdf' &&
          kind !== 'text' &&
          kind !== 'markdown' &&
          kind !== 'docx' &&
          kind !== 'pptx'
        ) {
          continue
        }
        const bodyHtml = typeof x.bodyHtml === 'string' ? x.bodyHtml : ''
        const st = x.status as WorkspaceFolderFileStatus
        const status: WorkspaceFolderFileStatus =
          st === 'ready' || st === 'error' ? st : 'error'
        let error = typeof x.error === 'string' ? x.error : undefined
        if (status === 'error' && !error) error = 'Invalid saved file entry.'
        files.push(normalizeHydratedFile({ id: fid, relPath, displayName, kind, bodyHtml, status, error }))
      }
      out.push({ id, label, createdAt, files })
    }
    return out
  } catch {
    return []
  }
}
