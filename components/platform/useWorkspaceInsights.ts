'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WorkspaceDocInsight, WorkspaceInsightsPayload } from '@/lib/platform/workspaceDocInsights'

export function useWorkspaceInsights(enabled: boolean, documentsFingerprint?: string) {
  const [byDocId, setByDocId] = useState<Record<string, WorkspaceDocInsight>>({})
  const [workspaceDocCount, setWorkspaceDocCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setByDocId({})
      setWorkspaceDocCount(0)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/platform/workspace/insights')
      const raw = await res.text()
      let payload: WorkspaceInsightsPayload & { error?: string } = { byDocId: {}, workspaceDocCount: 0 }
      try {
        payload = JSON.parse(raw) as WorkspaceInsightsPayload & { error?: string }
      } catch {
        throw new Error(raw.slice(0, 200))
      }
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
      setByDocId(payload.byDocId ?? {})
      setWorkspaceDocCount(typeof payload.workspaceDocCount === 'number' ? payload.workspaceDocCount : 0)
    } catch {
      setByDocId({})
      setWorkspaceDocCount(0)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh, documentsFingerprint])

  useEffect(() => {
    if (!enabled) return
    const fn = () => void refresh()
    window.addEventListener('rontzen-workspace-analyzed', fn)
    return () => window.removeEventListener('rontzen-workspace-analyzed', fn)
  }, [enabled, refresh])

  return { byDocId, workspaceDocCount, loading, refresh }
}
