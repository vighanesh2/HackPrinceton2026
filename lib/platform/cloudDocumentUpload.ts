'use client'

import { aiMarkdownToEditorHtml, coerceStoredEditorHtml } from '@/components/platform/editorHtml'
import {
  classifyWorkspaceFile,
  MAX_WORKSPACE_FOLDER_FILE_CHARS,
  plainExtractToEditorHtml,
  type WorkspaceFolderFileKind,
} from '@/lib/platform/workspaceFolders'

export const CLOUD_WORKSPACE_UPLOAD_ACCEPT =
  '.pdf,.docx,.dotx,.pptx,.txt,.text,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown'

export type CloudUploadDraft =
  | {
      ok: true
      title: string
      body_html: string
      kind: WorkspaceFolderFileKind
    }
  | {
      ok: false
      title: string
      error: string
    }

async function jsonFromResponse<T>(response: Response, label: string): Promise<T> {
  const raw = await response.text()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(raw.trimStart().startsWith('<') ? `${label} returned HTML instead of JSON.` : raw.slice(0, 200))
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`${label} returned invalid JSON.`)
  }
}

async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/platform/extract-pdf', { method: 'POST', body: formData })
  const payload = await jsonFromResponse<{ text?: string; error?: string }>(response, 'PDF extract')
  if (!response.ok) throw new Error(payload.error || `PDF extract failed (${response.status}).`)
  return (payload.text || '').trim()
}

async function extractDocxHtml(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/platform/extract-docx', { method: 'POST', body: formData })
  const payload = await jsonFromResponse<{ html?: string; error?: string }>(response, 'DOCX extract')
  if (!response.ok) throw new Error(payload.error || `DOCX extract failed (${response.status}).`)
  return (payload.html || '').trim()
}

async function extractPptxText(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/platform/extract-pptx', { method: 'POST', body: formData })
  const payload = await jsonFromResponse<{ text?: string; error?: string }>(response, 'PPTX extract')
  if (!response.ok) throw new Error(payload.error || `PPTX extract failed (${response.status}).`)
  return (payload.text || '').trim()
}

function uploadTitle(file: File): string {
  const name = (file.name || 'Untitled').trim()
  return name.replace(/\.(pdf|docx|dotx|pptx|txt|text|md|markdown)$/i, '').slice(0, 500) || 'Untitled'
}

export async function extractCloudUploadDraft(file: File): Promise<CloudUploadDraft> {
  const title = uploadTitle(file)
  const kind = classifyWorkspaceFile(file)
  if (!kind) {
    return {
      ok: false,
      title,
      error: 'Unsupported file type. Use PDF, Word, PowerPoint .pptx, Markdown, or plain text.',
    }
  }

  try {
    if (kind === 'pdf') {
      const text = await extractPdfText(file)
      if (!text.trim()) return { ok: false, title, error: 'No extractable text in this PDF.' }
      return { ok: true, title, kind, body_html: plainExtractToEditorHtml(text) }
    }
    if (kind === 'docx') {
      const rawHtml = await extractDocxHtml(file)
      const html = coerceStoredEditorHtml(rawHtml)
      return {
        ok: true,
        title,
        kind,
        body_html:
          html.replace(/<[^>]+>/g, ' ').length > MAX_WORKSPACE_FOLDER_FILE_CHARS
            ? `${html.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)}<p>[Truncated]</p>`
            : html,
      }
    }
    if (kind === 'pptx') {
      const text = await extractPptxText(file)
      if (!text.trim()) return { ok: false, title, error: 'No extractable text in this PPTX.' }
      return { ok: true, title, kind, body_html: plainExtractToEditorHtml(text) }
    }
    if (kind === 'markdown') {
      const text = await file.text()
      return {
        ok: true,
        title,
        kind,
        body_html: aiMarkdownToEditorHtml(text.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)),
      }
    }

    const text = await file.text()
    return {
      ok: true,
      title,
      kind,
      body_html: plainExtractToEditorHtml(text.slice(0, MAX_WORKSPACE_FOLDER_FILE_CHARS)),
    }
  } catch (e) {
    return { ok: false, title, error: e instanceof Error ? e.message : 'Extraction failed.' }
  }
}
