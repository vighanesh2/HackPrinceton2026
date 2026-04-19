import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { findSafeMatchRanges } from '@/lib/platform/conflictSafeMatch'

/** Dispatch `tr.setMeta(conflictUnderlineRefreshKey, true)` to rebuild underlines after phrase list changes. */
export const conflictUnderlineRefreshKey = new PluginKey<boolean>('conflictUnderlineRefresh')

const decoKey = new PluginKey<DecorationSet>('conflictUnderlineDeco')

function mergeIntervals(intervals: { start: number; end: number }[]): { start: number; end: number }[] {
  if (!intervals.length) return []
  const sorted = [...intervals].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: { start: number; end: number }[] = []
  for (const cur of sorted) {
    const prev = out[out.length - 1]
    if (!prev || cur.start >= prev.end) out.push({ ...cur })
    else prev.end = Math.max(prev.end, cur.end)
  }
  return out
}

function buildDecoSet(doc: ProseMirrorNode, phrases: string[]): DecorationSet {
  const decos: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const text = node.text
    const rawMatches: { start: number; end: number }[] = []
    for (const frag of phrases) {
      if (!frag || frag.length < 2) continue
      for (const m of findSafeMatchRanges(text, frag)) {
        rawMatches.push(m)
      }
    }
    const merged = mergeIntervals(rawMatches)
    for (const m of merged) {
      decos.push(
        Decoration.inline(pos + m.start, pos + m.end, {
          class: 'notion-conflict-underline',
        })
      )
    }
  })
  return DecorationSet.create(doc, decos)
}

export const ConflictUnderline = Extension.create<{
  getPhrases: () => string[]
}>({
  name: 'conflictUnderline',

  addOptions() {
    return {
      getPhrases: () => [] as string[],
    }
  },

  addProseMirrorPlugins() {
    const ext = this

    return [
      new Plugin<DecorationSet>({
        key: decoKey,
        state: {
          init(_, { doc }) {
            return buildDecoSet(doc, ext.options.getPhrases())
          },
          apply(tr, oldDeco, _, state) {
            if (tr.getMeta(conflictUnderlineRefreshKey)) {
              return buildDecoSet(state.doc, ext.options.getPhrases())
            }
            if (tr.docChanged) {
              return buildDecoSet(state.doc, ext.options.getPhrases())
            }
            return oldDeco
          },
        },
        props: {
          decorations(state) {
            return decoKey.getState(state) ?? DecorationSet.empty
          },
        },
      }),
    ]
  },
})
