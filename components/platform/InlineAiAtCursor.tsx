'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { aiMarkdownToEditorHtml } from '@/components/platform/editorHtml'
import { invalidateShadowCompleter } from '@/components/platform/shadowCompleterExtension'

type Props = {
  editor: Editor
  getWorkspaceContext: () => string
}

function snippetAroundCursor(editor: Editor): string {
  try {
    const { state } = editor
    const from = state.selection.from
    const start = Math.max(0, from - 900)
    const end = Math.min(state.doc.content.size, from + 900)
    return state.doc.textBetween(start, end, '\n', ' ').slice(0, 2000)
  } catch {
    return ''
  }
}

export function InlineAiAtCursor({ editor, getWorkspaceContext }: Props) {
  const [everFocused, setEverFocused] = useState(false)
  const [fabPos, setFabPos] = useState<{ top: number; left: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const busyRef = useRef(false)

  const updateFabPosition = useCallback(() => {
    if (!editor.view || editor.isDestroyed) {
      setFabPos(null)
      return
    }
    if (!editor.isEditable) {
      if (!open) setFabPos(null)
      return
    }
    const sel = editor.state.selection
    if (!(sel instanceof TextSelection) || !sel.empty) {
      setFabPos(null)
      if (open) {
        setOpen(false)
        setError(null)
      }
      return
    }
    const coords = editor.view.coordsAtPos(sel.from)
    setFabPos({ top: coords.bottom + 6, left: coords.left })
  }, [editor, open])

  useEffect(() => {
    const onMove = () => requestAnimationFrame(updateFabPosition)
    const onFocus = () => {
      setEverFocused(true)
      requestAnimationFrame(updateFabPosition)
    }
    editor.on('selectionUpdate', onMove)
    editor.on('transaction', onMove)
    editor.on('focus', onFocus)
    editor.on('blur', onMove)
    return () => {
      editor.off('selectionUpdate', onMove)
      editor.off('transaction', onMove)
      editor.off('focus', onFocus)
      editor.off('blur', onMove)
    }
  }, [editor, updateFabPosition])

  useEffect(() => {
    if (!open) return
    const onDocMouse = (e: MouseEvent) => {
      const el = popoverRef.current
      if (el?.contains(e.target as Node)) return
      const t = e.target as HTMLElement | null
      if (t?.closest?.('.inline-ai-fab')) return
      setOpen(false)
      setError(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setError(null)
      }
    }
    document.addEventListener('mousedown', onDocMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [open])

  async function runGenerate() {
    const p = prompt.trim()
    if (!p || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/inline-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          context: getWorkspaceContext(),
          snippet: snippetAroundCursor(editor),
        }),
      })
      const data = (await res.json()) as { markdown?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const md = (data.markdown || '').trim()
      if (!md) throw new Error('Empty response from model.')
      const html = aiMarkdownToEditorHtml(md)
      editor.chain().focus().insertContent(html).run()
      invalidateShadowCompleter(editor)
      setOpen(false)
      setPrompt('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  if ((!everFocused && !open) || (!fabPos && !open)) return null

  return (
    <>
      {fabPos ? (
        <button
          type="button"
          className="inline-ai-fab"
          style={{ position: 'fixed', top: fabPos.top, left: fabPos.left, zIndex: 3000 }}
          title="Ask AI to write at cursor"
          aria-label="Ask AI to write at cursor"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setError(null)
            setOpen((prev) => {
              const next = !prev
              if (next) requestAnimationFrame(updateFabPosition)
              return next
            })
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16zM16 17l.5 1.5L18 19l-1.5.5L16 21l-.5-1.5L14 19l1.5-.5L16 17z"
              fill="currentColor"
            />
          </svg>
        </button>
      ) : null}

      {open ? (
        <div
          ref={popoverRef}
          className="inline-ai-popover"
          style={{
            position: 'fixed',
            top: fabPos ? Math.min(fabPos.top + 36, window.innerHeight - 220) : 120,
            left: fabPos ? Math.min(fabPos.left, window.innerWidth - 340) : 24,
            zIndex: 3001,
          }}
          role="dialog"
          aria-label="AI write prompt"
        >
          <div className="inline-ai-popover-head">
            <span className="inline-ai-popover-title">Write at cursor</span>
            <button
              type="button"
              className="inline-ai-popover-close"
              aria-label="Close"
              onClick={() => {
                setOpen(false)
                setError(null)
              }}
            >
              ×
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="inline-ai-popover-input"
            rows={3}
            placeholder="e.g. Which competitor is closest to us and why?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            maxLength={2000}
          />
          {error ? <p className="inline-ai-popover-error">{error}</p> : null}
          <div className="inline-ai-popover-actions">
            <button
              type="button"
              className="inline-ai-popover-submit"
              disabled={busy || !prompt.trim()}
              onClick={() => void runGenerate()}
            >
              {busy ? 'Writing…' : 'Insert'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
