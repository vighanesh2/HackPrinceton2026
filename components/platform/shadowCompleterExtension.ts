import { Extension, type Editor } from '@tiptap/core'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { detectShadowPattern } from '@/lib/platform/shadowCompleteGates'

type ShadowCompleterSideStorage = {
  debounceTimer: ReturnType<typeof setTimeout> | null
  sessionToken: number
}

function shadowCompleterSideStore(editor: Editor): ShadowCompleterSideStorage {
  return (editor.storage as unknown as { shadowCompleter: ShadowCompleterSideStorage }).shadowCompleter
}

export const shadowCompleterPluginKey = new PluginKey<ShadowCompleterState>('shadowCompleter')

export type ShadowCompleterState = {
  ghost: string | null
  pos: number | null
  sourceHint: string | null
}

const emptyState: ShadowCompleterState = {
  ghost: null,
  pos: null,
  sourceHint: null,
}

type ShadowMeta =
  | { type: 'set'; ghost: string; pos: number; sourceHint?: string }
  | { type: 'clear' }

function blockTextBeforeCursor(state: EditorState): string {
  const { $from } = state.selection
  if (!$from.parent.isTextblock) return ''
  const start = $from.start()
  return state.doc.textBetween(start, $from.pos, '\n', ' ')
}

function applyShadowMeta(tr: Transaction, prev: ShadowCompleterState): ShadowCompleterState {
  const meta = tr.getMeta(shadowCompleterPluginKey) as ShadowMeta | undefined
  if (meta?.type === 'clear') return { ...emptyState }
  if (meta?.type === 'set') {
    return {
      ghost: meta.ghost,
      pos: meta.pos,
      sourceHint: meta.sourceHint?.trim() || null,
    }
  }
  if (tr.docChanged || tr.selectionSet) return { ...emptyState }
  return prev
}

export const ShadowCompleter = Extension.create<{
  getContext: () => string
}>({
  name: 'shadowCompleter',
  priority: 900,

  addStorage() {
    return {
      debounceTimer: null as ReturnType<typeof setTimeout> | null,
      sessionToken: 0,
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const st = shadowCompleterPluginKey.getState(this.editor.state)
        if (!st?.ghost || st.pos == null) return false
        const { from } = this.editor.state.selection
        if (from !== st.pos) return false
        const ghost = st.ghost
        this.editor
          .chain()
          .focus()
          .command(({ tr, state }) => {
            tr.insertText(ghost, state.selection.from)
            tr.setMeta(shadowCompleterPluginKey, { type: 'clear' } satisfies ShadowMeta)
            return true
          })
          .run()
        return true
      },
      Escape: () => {
        const st = shadowCompleterPluginKey.getState(this.editor.state)
        if (!st?.ghost) return false
        this.editor.view.dispatch(this.editor.state.tr.setMeta(shadowCompleterPluginKey, { type: 'clear' }))
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const getContext = this.options.getContext

    const plugin = new Plugin<ShadowCompleterState>({
      key: shadowCompleterPluginKey,
      state: {
        init: () => ({ ...emptyState }),
        apply(tr, prev) {
          return applyShadowMeta(tr, prev)
        },
      },
      props: {
        decorations(state) {
          const st = shadowCompleterPluginKey.getState(state)
          if (!st?.ghost || st.pos == null) return DecorationSet.empty
          if (st.pos < 0 || st.pos > state.doc.content.size) return DecorationSet.empty
          const widget = Decoration.widget(
            st.pos,
            () => {
              const wrap = document.createElement('span')
              wrap.className = 'shadow-complete-widget'
              wrap.setAttribute('contenteditable', 'false')
              wrap.setAttribute('aria-hidden', 'true')
              const ghost = document.createElement('span')
              ghost.className = 'shadow-complete-ghost'
              ghost.textContent = st.ghost || ''
              wrap.appendChild(ghost)
              if (st.sourceHint) {
                const hint = document.createElement('span')
                hint.className = 'shadow-complete-hint'
                hint.textContent = ` · ${st.sourceHint}`
                wrap.appendChild(hint)
              }
              return wrap
            },
            { side: 1 }
          )
          return DecorationSet.create(state.doc, [widget])
        },
        handleDOMEvents: {
          blur: () => {
            const storage = shadowCompleterSideStore(editor)
            if (storage.debounceTimer) clearTimeout(storage.debounceTimer)
            storage.debounceTimer = null
            return false
          },
        },
      },
      view() {
        return {
          update: (view) => {
            const storage = shadowCompleterSideStore(editor)
            if (storage.debounceTimer) clearTimeout(storage.debounceTimer)
            storage.debounceTimer = null
            storage.sessionToken += 1
            const session = storage.sessionToken

            storage.debounceTimer = setTimeout(() => {
              storage.debounceTimer = null
              if (!editor.view || editor.isDestroyed) return

              const sel = view.state.selection
              if (!(sel instanceof TextSelection) || !sel.empty) {
                view.dispatch(view.state.tr.setMeta(shadowCompleterPluginKey, { type: 'clear' }))
                return
              }

              const line = blockTextBeforeCursor(view.state)
              const pattern = detectShadowPattern(line)
              if (!pattern) {
                view.dispatch(view.state.tr.setMeta(shadowCompleterPluginKey, { type: 'clear' }))
                return
              }

              const prefix = line.slice(-400)
              const context = (getContext?.() || '').trim() || 'No workspace context.'

              void (async () => {
                try {
                  const res = await fetch('/api/platform/shadow-complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prefix, pattern, context }),
                  })
                  const payload = (await res.json()) as {
                    completion?: string
                    sourceHint?: string
                    error?: string
                  }
                  if (session !== storage.sessionToken) return
                  if (!editor.view || editor.isDestroyed) return

                  const completion = (payload.completion || '').trim()
                  if (!res.ok || !completion) {
                    editor.view.dispatch(editor.state.tr.setMeta(shadowCompleterPluginKey, { type: 'clear' }))
                    return
                  }

                  const pos = editor.state.selection.from
                  if (detectShadowPattern(blockTextBeforeCursor(editor.state)) !== pattern) return

                  editor.view.dispatch(
                    editor.state.tr.setMeta(shadowCompleterPluginKey, {
                      type: 'set',
                      ghost: completion,
                      pos,
                      sourceHint: payload.sourceHint,
                    })
                  )
                } catch {
                  if (editor.view && !editor.isDestroyed) {
                    editor.view.dispatch(editor.state.tr.setMeta(shadowCompleterPluginKey, { type: 'clear' }))
                  }
                }
              })()
            }, 320)
          },
          destroy: () => {
            const storage = shadowCompleterSideStore(editor)
            if (storage.debounceTimer) clearTimeout(storage.debounceTimer)
            storage.debounceTimer = null
          },
        }
      },
    })

    return [plugin]
  },
})
