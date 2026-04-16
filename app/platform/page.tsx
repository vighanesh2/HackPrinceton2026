'use client'

import { useEffect, useRef, useState } from 'react'
import { RichDocEditor } from '@/components/platform/RichDocEditor'
import { aiMarkdownToEditorHtml, coerceStoredEditorHtml } from '@/components/platform/editorHtml'

const STORAGE_TITLE_KEY = 'platform_notion_title'
const STORAGE_BODY_KEY = 'platform_notion_body'
const STORAGE_ACTIVE_TAB_KEY = 'platform_notion_active_tab'
const STORAGE_ONE_PAGER_SUMMARY_KEY = 'platform_one_pager_summary'
const STORAGE_ONE_PAGER_VIEW_TITLE_KEY = 'platform_one_pager_view_title'
const STORAGE_ONE_PAGER_FILENAME_KEY = 'platform_one_pager_filename'
const STORAGE_ONE_PAGER_DECK_TEXT_KEY = 'platform_one_pager_deck_text'

const MAX_PDF_TEXT_CHARS = 24000

type TabId = 'doc' | 'onepager'

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
  const [activeTab, setActiveTab] = useState<TabId>('doc')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const [deckFileName, setDeckFileName] = useState<string | null>(null)
  const [deckText, setDeckText] = useState('')
  const [onePagerSummary, setOnePagerSummary] = useState('')
  const [onePagerViewTitle, setOnePagerViewTitle] = useState('')
  const [onePagerError, setOnePagerError] = useState<string | null>(null)
  const [isGeneratingOnePager, setIsGeneratingOnePager] = useState(false)
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const deckFileInputRef = useRef<HTMLInputElement>(null)
  const onePagerViewTitleRef = useRef('')

  useEffect(() => {
    const savedTitle = window.localStorage.getItem(STORAGE_TITLE_KEY) || ''
    const savedBody = window.localStorage.getItem(STORAGE_BODY_KEY) || ''
    const savedTab = window.localStorage.getItem(STORAGE_ACTIVE_TAB_KEY) as TabId | null
    const savedSummary = window.localStorage.getItem(STORAGE_ONE_PAGER_SUMMARY_KEY) || ''
    const savedViewTitle = window.localStorage.getItem(STORAGE_ONE_PAGER_VIEW_TITLE_KEY) || ''
    const savedDeckName = window.localStorage.getItem(STORAGE_ONE_PAGER_FILENAME_KEY) || ''
    const savedDeckText = window.localStorage.getItem(STORAGE_ONE_PAGER_DECK_TEXT_KEY) || ''
    setTitle(savedTitle)
    setBody(coerceStoredEditorHtml(savedBody))
    if (savedTab === 'doc' || savedTab === 'onepager') setActiveTab(savedTab)
    setOnePagerSummary(coerceStoredEditorHtml(savedSummary))
    setOnePagerViewTitle(savedViewTitle)
    setDeckFileName(savedDeckName || null)
    setDeckText(savedDeckText)
    if (savedDeckName && !savedDeckText.trim()) {
      setOnePagerError(
        'This deck was selected before, but no extracted text is saved. Choose the PDF again to extract text, or pick a PDF with selectable text (not image-only).'
      )
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_TITLE_KEY, title)
  }, [title])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_BODY_KEY, body)
  }, [body])

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
      setTitle((docPrev) => (docPrev.trim() ? docPrev : nextViewTitle))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate one pager.'
      setOnePagerError(message)
    } finally {
      setIsGeneratingOnePager(false)
    }
  }

  return (
    <main className="notion-page">
      <div className="notion-shell">
        <aside className="notion-sidebar" aria-label="Sidebar">
          <div className="notion-sidebar-brand">Workspace</div>
          <nav className="notion-sidebar-nav">
            <button
              type="button"
              className={`notion-sidebar-item ${activeTab === 'doc' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('doc')}
            >
              Document
            </button>
            <button
              type="button"
              className={`notion-sidebar-item ${activeTab === 'onepager' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('onepager')}
            >
              One pager
            </button>
          </nav>
        </aside>

        <div className="notion-main">
          {activeTab === 'doc' ? (
            <article className="notion-doc" aria-label="Document editor">
              <input
                className="notion-title"
                placeholder="Untitled"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <RichDocEditor
                value={body}
                onChange={setBody}
                placeholder="Start writing…"
              />
            </article>
          ) : (
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
                    onClick={generateOnePager}
                    disabled={
                      isGeneratingOnePager || isExtractingPdf || !deckText.trim()
                    }
                  >
                    {isGeneratingOnePager ? 'Generating…' : 'Generate 1-pager'}
                  </button>
                </div>
              </div>

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
          )}
        </div>
      </div>
    </main>
  )
}
