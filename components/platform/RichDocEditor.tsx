'use client'

import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Link from '@tiptap/extension-link'
import { ShadowCompleter } from '@/components/platform/shadowCompleterExtension'

type RichDocEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Workspace text used to ground ghost completions (financial / ownership / boilerplate). Omit to disable. */
  shadowContext?: string
  /** Optional class on the editor shell (e.g. one-pager print template theme). */
  surfaceClass?: string
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

function Toolbar({ editor, shadowEnabled }: { editor: Editor | null; shadowEnabled: boolean }) {
  if (!editor) return null

  return (
    <div className="notion-rte-toolbar" role="toolbar" aria-label="Text formatting">
      {shadowEnabled ? (
        <span className="notion-rte-shadow-hint" title="Ghost text from your workspace. Tab to insert, Esc to dismiss.">
          Shadow
        </span>
      ) : null}
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
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-pressed={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-pressed={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        aria-label="Heading 3"
      >
        H3
      </button>
      <span className="notion-rte-toolbar-sep" aria-hidden />
      <button
        type="button"
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-pressed={editor.isActive('bulletList')}
        title="Bullet list"
        aria-label="Bullet list"
      >
        •
      </button>
      <button
        type="button"
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-pressed={editor.isActive('orderedList')}
        title="Numbered list"
        aria-label="Numbered list"
      >
        1.
      </button>
      <button
        type="button"
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-pressed={editor.isActive('blockquote')}
        title="Quote"
        aria-label="Quote"
      >
        “
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

export function RichDocEditor({ value, onChange, placeholder, shadowContext, surfaceClass }: RichDocEditorProps) {
  const shadowEnabled = shadowContext !== undefined
  const contextRef = useRef(shadowContext ?? '')
  contextRef.current = shadowContext ?? ''

  const extensions = useMemo(() => {
    const docExtensions = [
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
    ]
    const base = shadowEnabled
      ? [
          ...docExtensions,
          ShadowCompleter.configure({
            getContext: () => contextRef.current,
          }),
        ]
      : docExtensions
    return base
  }, [placeholder, shadowEnabled])

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

  const shellClass = ['notion-rte', surfaceClass].filter(Boolean).join(' ')

  return (
    <div className={shellClass}>
      <Toolbar editor={editor} shadowEnabled={shadowEnabled} />
      <EditorContent editor={editor} className="notion-rte-content" />
    </div>
  )
}
