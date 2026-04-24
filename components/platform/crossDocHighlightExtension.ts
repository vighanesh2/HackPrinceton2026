import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { CrossDocEditorMark } from '@/lib/platform/buildCrossDocEditorMarks'
import { findSafeMatchRanges } from '@/lib/platform/conflictSafeMatch'

/** Dispatch to rebuild cross-doc decorations after the mark list changes. */
export const crossDocHighlightRefreshKey = new PluginKey<boolean>('crossDocHighlightRefresh')

const decoKey = new PluginKey<DecorationSet>('crossDocHighlightDeco')

type TaggedRange = { start: number; end: number; titles: Set<string> }

/** Safe for HTML attributes + CSS `attr()` tooltips (no raw `"` or `<`). */
function tipForDom(titles: string[]): string {
  return titles
    .join(' · ')
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/</g, '‹')
    .trim()
    .slice(0, 480)
}

function mergeTaggedIntervals(intervals: TaggedRange[]): TaggedRange[] {
  if (!intervals.length) return []
  const sorted = [...intervals].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: TaggedRange[] = []
  for (const cur of sorted) {
    const prev = out[out.length - 1]
    if (!prev || cur.start >= prev.end) {
      out.push({ start: cur.start, end: cur.end, titles: new Set(cur.titles) })
    } else {
      prev.end = Math.max(prev.end, cur.end)
      for (const t of cur.titles) prev.titles.add(t)
    }
  }
  return out
}

function buildDecoSet(doc: ProseMirrorNode, marks: CrossDocEditorMark[]): DecorationSet {
  const tagged: TaggedRange[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const text = node.text
    for (const { phrase, title } of marks) {
      if (!phrase || phrase.length < 2) continue
      for (const m of findSafeMatchRanges(text, phrase)) {
        tagged.push({
          start: pos + m.start,
          end: pos + m.end,
          titles: new Set([title]),
        })
      }
    }
  })
  const merged = mergeTaggedIntervals(tagged)
  const decos = merged.map((m) => {
    const tip = tipForDom([...m.titles])
    return Decoration.inline(m.start, m.end, {
      class: 'notion-crossdoc-flag',
      'data-crossdoc-tip': tip,
      /** Avoid native `title` + CSS `::after` showing duplicate tooltips. */
      'aria-label': `Workspace flag: ${tip.slice(0, 200)}`,
    })
  })
  return DecorationSet.create(doc, decos)
}

export const CrossDocHighlight = Extension.create<{
  getMarks: () => CrossDocEditorMark[]
}>({
  name: 'crossDocHighlight',

  addOptions() {
    return {
      getMarks: () => [] as CrossDocEditorMark[],
    }
  },

  addProseMirrorPlugins() {
    const ext = this
    return [
      new Plugin<DecorationSet>({
        key: decoKey,
        state: {
          init(_, { doc }) {
            return buildDecoSet(doc, ext.options.getMarks())
          },
          apply(tr, oldDeco, _, state) {
            if (tr.getMeta(crossDocHighlightRefreshKey)) {
              return buildDecoSet(state.doc, ext.options.getMarks())
            }
            if (tr.docChanged) {
              return buildDecoSet(state.doc, ext.options.getMarks())
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
