import { marked } from 'marked'

marked.use({ gfm: true, breaks: true })

/** If stored value is not HTML (legacy plain / Markdown), convert for TipTap. */
export function coerceStoredEditorHtml(raw: string): string {
  const trimmed = (raw || '').trim()
  if (!trimmed) return ''
  if (/^\s*</.test(trimmed)) return raw
  try {
    return marked(trimmed, { async: false }) as string
  } catch {
    const escaped = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<p>${escaped}</p>`
  }
}

export function aiMarkdownToEditorHtml(md: string): string {
  const t = (md || '').trim()
  if (!t) return ''
  return marked(t, { async: false }) as string
}
