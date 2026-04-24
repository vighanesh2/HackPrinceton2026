'use client'

import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Link from '@tiptap/extension-link'
import {
  ConflictUnderline,
  conflictUnderlineRefreshKey,
} from '@/components/platform/conflictUnderlineExtension'

type RichDocEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Optional class on the editor shell (e.g. one-pager print template theme). */
  surfaceClass?: string
  /** Substrings to underline in red when they appear in the doc (e.g. conflicting figures). */
  conflictHighlightPhrases?: string[]
  /** When `token` changes, scroll to the first case-insensitive match of `phrase` in the document. */
  scrollToConflict?: { phrase: string; token: number } | null
  onScrollToConflictComplete?: () => void
}

const EMPTY_CONFLICT_PHRASES: string[] = []

function findPhraseRangeCaseInsensitive(
  doc: ProseMirrorNode,
  phrase: string
): { from: number; to: number } | null {
  if (!phrase) return null
  const needle = phrase.toLowerCase()
  let found: { from: number; to: number } | null = null
  doc.descendants((node, pos) => {
    if (found || !node.isText || !node.text) return
    const text = node.text
    const tl = text.toLowerCase()
    const idx = tl.indexOf(needle)
    if (idx === -1) return
    found = { from: pos + idx, to: pos + idx + phrase.length }
  })
  return found
}

function toStoredHtml(editor: Editor): string {
  const html = editor.getHTML()
  if (html === '<p></p>') return ''
  if (/^<p>\s*<br\s+[^>]*>\s*<\/p>$/i.test(html.trim())) return ''
  return html
}

function fromStoredHtml(value: string): string {
  return value.trim() === '' ? '<p></p>' : value
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  return (
    <div className="notion-rte-toolbar" role="toolbar" aria-label="Text formatting">
      <button
        type="button"
        className={editor.isActive('bold') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-pressed={editor.isActive('bold')}
        title="Bold"
        aria-label="Bold"
      >
        B
      </button>
      <button
        type="button"
        className={editor.isActive('italic') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-pressed={editor.isActive('italic')}
        title="Italic"
        aria-label="Italic"
      >
        I
      </button>
      <span className="notion-rte-toolbar-sep" aria-hidden />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
        aria-label="Redo"
      >
        ↪
      </button>
    </div>
  )
}

export function RichDocEditor({
  value,
  onChange,
  placeholder,
  surfaceClass,
  conflictHighlightPhrases = EMPTY_CONFLICT_PHRASES,
  scrollToConflict = null,
  onScrollToConflictComplete,
}: RichDocEditorProps) {
  const conflictPhrasesRef = useRef<string[]>([])
  conflictPhrasesRef.current = conflictHighlightPhrases
  const conflictPhrasesKey = useMemo(
    () => conflictHighlightPhrases.map((p) => p.trim()).filter(Boolean).join('\u0000'),
    [conflictHighlightPhrases]
  )

  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'onepager-tpl-hero-img' },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: 'onepager-tpl-table-node' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: 'onepager-tpl-link',
          rel: 'noopener noreferrer',
        },
      }),
      ConflictUnderline.configure({
        getPhrases: () => conflictPhrasesRef.current,
      }),
    ],
    [placeholder]
  )

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions,
      content: '<p></p>',
      editorProps: {
        attributes: {
          class: 'notion-prosemirror',
          spellCheck: 'true',
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(toStoredHtml(ed))
      },
    },
    [extensions]
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const want = fromStoredHtml(value)
    if (editor.getHTML() === want) return
    try {
      editor.commands.setContent(want, { emitUpdate: false })
    } catch {
      editor.commands.setContent('<p></p>', { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const tr = editor.state.tr.setMeta(conflictUnderlineRefreshKey, true)
    editor.view.dispatch(tr)
  }, [editor, conflictPhrasesKey])

  useEffect(() => {
    if (!editor || editor.isDestroyed || !scrollToConflict?.phrase) return
    const phrase = scrollToConflict.phrase
    const want = fromStoredHtml(value)
    let cancelled = false
    let attempts = 0
    const maxAttempts = 20

    const run = () => {
      if (cancelled || !editor || editor.isDestroyed) return
      attempts += 1
      if (editor.getHTML() !== want) {
        if (attempts < maxAttempts) requestAnimationFrame(run)
        else onScrollToConflictComplete?.()
        return
      }
      const range = findPhraseRangeCaseInsensitive(editor.state.doc, phrase)
      if (!range) {
        onScrollToConflictComplete?.()
        return
      }
      const tr = editor.state.tr
        .setSelection(TextSelection.create(editor.state.doc, range.from, range.to))
        .scrollIntoView()
      editor.view.dispatch(tr)
      requestAnimationFrame(() => {
        if (cancelled || !editor || editor.isDestroyed) return
        const anchor = editor.view.domAtPos(range.from)
        const raw = anchor.node
        const scrollEl: HTMLElement | null =
          raw.nodeType === Node.TEXT_NODE ? (raw.parentElement as HTMLElement | null) : (raw as HTMLElement)
        scrollEl?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        onScrollToConflictComplete?.()
      })
    }
    requestAnimationFrame(() => requestAnimationFrame(run))
    return () => {
      cancelled = true
    }
  }, [editor, value, scrollToConflict, onScrollToConflictComplete])

  const shellClass = ['notion-rte', surfaceClass].filter(Boolean).join(' ')

  return (
    <div className={shellClass}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="notion-rte-content" />
    </div>
  )
}
