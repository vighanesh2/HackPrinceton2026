'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Link from '@tiptap/extension-link'
import { crossDocHighlightRefreshKey, CrossDocHighlight } from '@/components/platform/crossDocHighlightExtension'
import type { CrossDocEditorMark } from '@/lib/platform/buildCrossDocEditorMarks'
import type { WorkspaceCrossDocIssue } from '@/lib/platform/crossDocWorkspace'

type RichDocEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Optional class on the editor shell (e.g. one-pager print template theme). */
  surfaceClass?: string
  /** In-document cross-workspace flags (native tooltip via `title` on hover). */
  crossDocMarks?: CrossDocEditorMark[]
  /** Open issues touching this document (for compact toolbar menu). */
  crossDocIssuesInDoc?: WorkspaceCrossDocIssue[]
  onDismissCrossDocIssue?: (issueId: string) => void
  onRestoreDismissedCrossDoc?: () => void
  crossDocDismissedCount?: number
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

function Toolbar({
  editor,
  crossDocMarks,
  crossDocIssuesInDoc,
  onDismissCrossDocIssue,
  onRestoreDismissedCrossDoc,
  crossDocDismissedCount,
}: {
  editor: Editor | null
  crossDocMarks: CrossDocEditorMark[]
  crossDocIssuesInDoc: WorkspaceCrossDocIssue[]
  onDismissCrossDocIssue?: (issueId: string) => void
  onRestoreDismissedCrossDoc?: () => void
  crossDocDismissedCount: number
}) {
  const [flagsOpen, setFlagsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!flagsOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setFlagsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [flagsOpen])

  const flagCount = crossDocIssuesInDoc.length
  const showFlagsMenu = flagCount > 0 || crossDocDismissedCount > 0 || crossDocMarks.length > 0

  return (
    <div className="notion-rte-toolbar" role="toolbar" aria-label="Text formatting">
      <button
        type="button"
        className={editor?.isActive('bold') ? 'is-active' : ''}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        aria-pressed={editor?.isActive('bold')}
        title="Bold"
        aria-label="Bold"
      >
        B
      </button>
      <button
        type="button"
        className={editor?.isActive('italic') ? 'is-active' : ''}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        aria-pressed={editor?.isActive('italic')}
        title="Italic"
        aria-label="Italic"
      >
        I
      </button>
      <span className="notion-rte-toolbar-sep" aria-hidden />
      <button
        type="button"
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
        title="Undo"
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
        title="Redo"
        aria-label="Redo"
      >
        ↪
      </button>

      {showFlagsMenu ? (
        <>
          <span className="notion-rte-toolbar-sep" aria-hidden />
          <div className="notion-rte-flags-wrap" ref={menuRef}>
            <button
              type="button"
              className={`notion-rte-flags-btn ${flagCount > 0 ? 'has-flags' : ''}`}
              aria-expanded={flagsOpen}
              onClick={() => setFlagsOpen((o) => !o)}
              title="Workspace flags on this document — hover highlighted text for details"
            >
              Flags{flagCount > 0 ? ` (${flagCount})` : ''}
            </button>
            {flagsOpen ? (
              <div className="notion-rte-flags-menu" role="menu" aria-label="Workspace flags">
                {flagCount === 0 ? (
                  <p className="notion-rte-flags-empty">No open flags in this file. Hover amber marks when they appear.</p>
                ) : (
                  <ul className="notion-rte-flags-list">
                    {crossDocIssuesInDoc.map((issue) => (
                      <li key={issue.id} className="notion-rte-flags-row">
                        <span className={`notion-rte-flags-sev notion-rte-flags-sev--${issue.severity}`}>
                          {issue.severity}
                        </span>
                        <span className="notion-rte-flags-summary">{issue.summary}</span>
                        {onDismissCrossDocIssue ? (
                          <button
                            type="button"
                            className="notion-rte-flags-dismiss"
                            onClick={() => onDismissCrossDocIssue(issue.id)}
                          >
                            Dismiss
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {crossDocDismissedCount > 0 && onRestoreDismissedCrossDoc ? (
                  <button type="button" className="notion-rte-flags-restore" onClick={() => onRestoreDismissedCrossDoc()}>
                    Restore {crossDocDismissedCount} dismissed
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

export function RichDocEditor({
  value,
  onChange,
  placeholder,
  surfaceClass,
  crossDocMarks = [],
  crossDocIssuesInDoc = [],
  onDismissCrossDocIssue,
  onRestoreDismissedCrossDoc,
  crossDocDismissedCount = 0,
}: RichDocEditorProps) {
  const marksRef = useRef<CrossDocEditorMark[]>([])
  marksRef.current = crossDocMarks

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
      CrossDocHighlight.configure({
        getMarks: () => marksRef.current,
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

  const marksKey = useMemo(
    () =>
      crossDocMarks.length === 0
        ? ''
        : crossDocMarks.map((m) => `${m.phrase}\n${m.title}`).join('\t'),
    [crossDocMarks]
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const tr = editor.state.tr.setMeta(crossDocHighlightRefreshKey, true)
    editor.view.dispatch(tr)
  }, [editor, marksKey])

  const shellClass = ['notion-rte', surfaceClass].filter(Boolean).join(' ')

  return (
    <div className={shellClass}>
      <Toolbar
        editor={editor}
        crossDocMarks={crossDocMarks}
        crossDocIssuesInDoc={crossDocIssuesInDoc}
        onDismissCrossDocIssue={onDismissCrossDocIssue}
        onRestoreDismissedCrossDoc={onRestoreDismissedCrossDoc}
        crossDocDismissedCount={crossDocDismissedCount}
      />
      <EditorContent editor={editor} className="notion-rte-content" />
    </div>
  )
}
