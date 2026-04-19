'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { coerceStoredEditorHtml } from '@/components/platform/editorHtml'

function bodiesEquivalent(a: string, b: string): boolean {
  return coerceStoredEditorHtml(a || '') === coerceStoredEditorHtml(b || '')
}

export type CloudDocRow = {
  id: string
  doc_type: string
  title: string
  body_html: string
  updated_at: string
}

export function useCloudWorkspaceDocs(enabled: boolean) {
  const [documents, setDocuments] = useState<CloudDocRow[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeDoc = documents.find((d) => d.id === activeId) ?? null

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/documents')
      const raw = await res.text()
      let payload: { documents?: CloudDocRow[]; error?: string } = {}
      try {
        payload = JSON.parse(raw) as { documents?: CloudDocRow[]; error?: string }
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(payload.error || `HTTP ${res.status}`)
      }
      const list = payload.documents ?? []
      setDocuments(list)
      setActiveId((prev) => {
        if (prev && list.some((d) => d.id === prev)) return prev
        if (list.length > 0) return list[0].id
        return null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load documents.')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setDocuments([])
      setActiveId(null)
      return
    }
    void load()
  }, [enabled, load])

  const clearSelection = useCallback(() => {
    setActiveId(null)
  }, [])

  const selectDoc = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const updateLocalDoc = useCallback(
    (id: string, patch: Partial<Pick<CloudDocRow, 'title' | 'body_html' | 'doc_type'>>) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, ...patch, body_html: patch.body_html !== undefined ? patch.body_html : d.body_html } : d
        )
      )
    },
    []
  )

  const scheduleIndex = useCallback((docId: string) => {
    if (indexTimer.current) clearTimeout(indexTimer.current)
    indexTimer.current = setTimeout(() => {
      void fetch('/api/platform/index-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      })
        .then(async (res) => {
          let data: { docId?: string; doc_type?: string; ok?: boolean } = {}
          try {
            data = (await res.json()) as { docId?: string; doc_type?: string; ok?: boolean }
          } catch {
            return
          }
          if (data.docId && typeof data.doc_type === 'string') {
            updateLocalDoc(data.docId, { doc_type: data.doc_type })
          }
          if (res.ok && data.docId) {
            window.dispatchEvent(
              new CustomEvent('rontzen-workspace-analyzed', { detail: { docId: data.docId } })
            )
          }
        })
        .catch(() => {})
    }, 1200)
  }, [updateLocalDoc])

  const flushSave = useCallback(
    async (id: string, patch: { title?: string; body_html?: string }) => {
      const res = await fetch(`/api/platform/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const raw = await res.text()
      let payload: { document?: CloudDocRow; error?: string } = {}
      try {
        payload = JSON.parse(raw) as { document?: CloudDocRow; error?: string }
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(payload.error || `HTTP ${res.status}`)
      }
      if (payload.document) {
        const serverDoc = payload.document
        const resyncBox: { current: { title?: string; body_html?: string } | null } = { current: null }
        setDocuments((prev) =>
          prev.map((d) => {
            if (d.id !== id) return d
            const s = serverDoc
            let next = { ...s }
            if (patch.body_html !== undefined && !bodiesEquivalent(d.body_html, s.body_html)) {
              next = { ...next, body_html: d.body_html }
              resyncBox.current = { ...(resyncBox.current ?? {}), body_html: d.body_html }
            }
            if (patch.title !== undefined && d.title !== s.title) {
              next = { ...next, title: d.title }
              resyncBox.current = { ...(resyncBox.current ?? {}), title: d.title }
            }
            return next
          })
        )
        const pending = resyncBox.current
        if (pending && (pending.body_html !== undefined || pending.title !== undefined)) {
          setTimeout(() => {
            void flushSave(id, pending).catch((e) => {
              setError(e instanceof Error ? e.message : 'Save failed.')
            })
          }, 0)
        }
      }
      scheduleIndex(id)
    },
    [scheduleIndex]
  )

  const queueSave = useCallback(
    (id: string, patch: { title?: string; body_html?: string }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        void flushSave(id, patch).catch((e) => {
          setError(e instanceof Error ? e.message : 'Save failed.')
        })
      }, 800)
    },
    [flushSave]
  )

  const addDocument = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/platform/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          body_html: '',
        }),
      })
      const raw = await res.text()
      let payload: { document?: CloudDocRow; error?: string } = {}
      try {
        payload = JSON.parse(raw) as { document?: CloudDocRow; error?: string }
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(payload.error || `HTTP ${res.status}`)
      }
      if (payload.document) {
        setDocuments((prev) => [payload.document!, ...prev])
        setActiveId(payload.document.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create document.')
    }
  }, [])

  const deleteDocument = useCallback(
    async (id: string) => {
      setError(null)
      try {
        const res = await fetch(`/api/platform/documents/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(t.slice(0, 200) || `HTTP ${res.status}`)
        }
        setDocuments((prev) => {
          const next = prev.filter((d) => d.id !== id)
          setActiveId((cur) => {
            if (cur !== id) return cur
            return next[0]?.id ?? null
          })
          return next
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed.')
      }
    },
    []
  )

  return {
    enabled,
    documents,
    activeId,
    activeDoc,
    loading,
    error,
    clearSelection,
    selectDoc,
    addDocument,
    deleteDocument,
    queueSave,
    flushSave,
    updateLocalDoc,
    coerceHtml: coerceStoredEditorHtml,
    reload: load,
  }
}

export type CloudWorkspaceApi = ReturnType<typeof useCloudWorkspaceDocs>
