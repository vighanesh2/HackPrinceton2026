import { Extension, type Editor } from '@tiptap/core'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { detectShadowPattern, type ShadowPatternId } from '@/lib/platform/shadowCompleteGates'
import { buildShadowFallbackCompletion } from '@/lib/platform/shadowFallbackCompletion'

type ShadowCompleterSideStorage = {
  /** Debounces LLM fetch only; fallback ghost is shown in a microtask (feels instant). */
  fetchDebounceTimer: ReturnType<typeof setTimeout> | null
  sessionToken: number
  lastInvalidationSig: string
}

function shadowCompleterSideStore(editor: Editor): ShadowCompleterSideStorage {
  return (editor.storage as unknown as { shadowCompleter: ShadowCompleterSideStorage }).shadowCompleter
}

/** After programmatic inserts (e.g. inline AI), cancel pending fetches and skip stale microtasks so ghost text does not mirror the new content. */
export function invalidateShadowCompleter(editor: Editor): void {
  if (!editor.view || editor.isDestroyed) return
  const storage = shadowCompleterSideStore(editor)
  if (storage.fetchDebounceTimer) {
    clearTimeout(storage.fetchDebounceTimer)
    storage.fetchDebounceTimer = null
  }
  storage.sessionToken += 1
  storage.lastInvalidationSig = ''
  clearShadowIfNeeded(editor)
}

/** Wait for ProseMirror to finish the transaction, then run (same tick as possible). */
function afterDomUpdate(fn: () => void): void {
  queueMicrotask(fn)
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

function shadowGhostIsVisible(state: EditorState): boolean {
  const st = shadowCompleterPluginKey.getState(state)
  return Boolean(st?.ghost && st.pos != null)
}

/** Avoid dispatch → view.update → dispatch loops when the ghost is already cleared. */
function clearShadowIfNeeded(editor: Editor): void {
  if (!shadowGhostIsVisible(editor.state)) return
  editor.view.dispatch(editor.state.tr.setMeta(shadowCompleterPluginKey, { type: 'clear' }))
}

function setShadowIfChanged(
  editor: Editor,
  ghost: string,
  pos: number,
  sourceHint?: string
): void {
  const st = shadowCompleterPluginKey.getState(editor.state)
  const hint = sourceHint?.trim() || null
  if (st?.ghost === ghost && st?.pos === pos && (st.sourceHint || null) === hint) return
  editor.view.dispatch(
    editor.state.tr.setMeta(shadowCompleterPluginKey, {
      type: 'set',
      ghost,
      pos,
      sourceHint: sourceHint?.trim() || undefined,
    })
  )
}

export const ShadowCompleter = Extension.create<{
  getContext: () => string
}>({
  name: 'shadowCompleter',
  priority: 900,

  addStorage() {
    return {
      fetchDebounceTimer: null as ReturnType<typeof setTimeout> | null,
      sessionToken: 0,
      lastInvalidationSig: '',
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
            if (storage.fetchDebounceTimer) clearTimeout(storage.fetchDebounceTimer)
            storage.fetchDebounceTimer = null
            return false
          },
        },
      },
      view() {
        return {
          update: () => {
            const storage = shadowCompleterSideStore(editor)
            if (storage.fetchDebounceTimer) clearTimeout(storage.fetchDebounceTimer)
            storage.fetchDebounceTimer = null

            if (!editor.view || editor.isDestroyed) return

            const sel = editor.state.selection
            if (!(sel instanceof TextSelection) || !sel.empty) {
              clearShadowIfNeeded(editor)
              return
            }

            const line = blockTextBeforeCursor(editor.state)
            const pattern = detectShadowPattern(line)
            const invalidationSig = `${pattern ?? ''}\0${line}`
            if (invalidationSig !== storage.lastInvalidationSig) {
              storage.lastInvalidationSig = invalidationSig
              storage.sessionToken += 1
            }
            const session = storage.sessionToken
            if (!pattern) {
              clearShadowIfNeeded(editor)
              return
            }

            // Instant: workspace fallback on the next microtask (no debounce).
            afterDomUpdate(() => {
              if (session !== storage.sessionToken) return
              if (!editor.view || editor.isDestroyed) return
              const lineNow = blockTextBeforeCursor(editor.state)
              const patNow = detectShadowPattern(lineNow)
              if (patNow !== pattern) return
              const ctxNow = (getContext?.() || '').trim() || 'No workspace context.'
              const fb = buildShadowFallbackCompletion(patNow, ctxNow)
              if (fb) {
                setShadowIfChanged(
                  editor,
                  fb.completion.trim(),
                  editor.state.selection.from,
                  fb.sourceHint
                )
              }
            })

            // Debounced: LLM upgrade only (avoids a fetch per keystroke).
            storage.fetchDebounceTimer = setTimeout(() => {
              storage.fetchDebounceTimer = null
              if (session !== storage.sessionToken) return
              if (!editor.view || editor.isDestroyed) return

              const lineFetch = blockTextBeforeCursor(editor.state)
              const patternFetch = detectShadowPattern(lineFetch)
              if (patternFetch !== pattern) return
              const ctxFetch = (getContext?.() || '').trim() || 'No workspace context.'
              const prefixFetch = lineFetch.slice(-400)

              void (async () => {
                try {
                  const res = await fetch('/api/platform/shadow-complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prefix: prefixFetch, pattern: patternFetch, context: ctxFetch }),
                  })
                  const payload = (await res.json()) as {
                    completion?: string
                    sourceHint?: string
                    error?: string
                  }
                  if (session !== storage.sessionToken) return
                  if (!editor.view || editor.isDestroyed) return

                  let completion = (payload.completion || '').trim()
                  let sourceHint = (payload.sourceHint || '').trim()
                  if (!res.ok || !completion) {
                    const fb = buildShadowFallbackCompletion(patternFetch, ctxFetch)
                    if (fb) {
                      completion = fb.completion.trim()
                      sourceHint = fb.sourceHint
                    }
                  }
                  if (!completion) {
                    clearShadowIfNeeded(editor)
                    return
                  }

                  if (detectShadowPattern(blockTextBeforeCursor(editor.state)) !== patternFetch) return

                  setShadowIfChanged(
                    editor,
                    completion,
                    editor.state.selection.from,
                    sourceHint || undefined
                  )
                } catch {
                  if (session !== storage.sessionToken) return
                  if (!editor.view || editor.isDestroyed) return
                  const fb = buildShadowFallbackCompletion(patternFetch, ctxFetch)
                  if (
                    fb &&
                    detectShadowPattern(blockTextBeforeCursor(editor.state)) === patternFetch
                  ) {
                    setShadowIfChanged(
                      editor,
                      fb.completion.trim(),
                      editor.state.selection.from,
                      fb.sourceHint
                    )
                  }
                }
              })()
            }, 45)
          },
          destroy: () => {
            const storage = shadowCompleterSideStore(editor)
            if (storage.fetchDebounceTimer) clearTimeout(storage.fetchDebounceTimer)
            storage.fetchDebounceTimer = null
          },
        }
      },
    })

    return [plugin]
  },
})
