'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { CloudWorkspaceEditor, CloudWorkspaceSidebar } from '@/components/platform/CloudWorkspaceShell'
import { useCloudWorkspaceDocs } from '@/components/platform/useCloudWorkspaceDocs'
import { useWorkspaceInsights } from '@/components/platform/useWorkspaceInsights'
import {
  CLOUD_WORKSPACE_UPLOAD_ACCEPT,
  extractCloudUploadDraft,
} from '@/lib/platform/cloudDocumentUpload'

export default function CloudWorkspacePage() {
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState(false)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cloudEnabled = sessionReady && !!accountEmail && isSupabaseConfigured()
  const cloud = useCloudWorkspaceDocs(cloudEnabled)
  const documentsFingerprint = useMemo(
    () => cloud.documents.map((d) => `${d.id}:${d.updated_at}`).join('|'),
    [cloud.documents]
  )
  const insights = useWorkspaceInsights(cloudEnabled, documentsFingerprint)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionReady(true)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      if (!data.user) {
        router.replace('/login')
        return
      }
      setAccountEmail(data.user.email ?? null)
      setSessionReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  async function signOut() {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function openUploadPicker() {
    const input = fileInputRef.current
    if (!input || uploading) return
    input.value = ''
    input.click()
  }

  async function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length || uploading) return

    setUploading(true)
    setUploadError(null)
    const failures: string[] = []
    try {
      for (const file of files) {
        const draft = await extractCloudUploadDraft(file)
        if (!draft.ok) {
          failures.push(`${draft.title}: ${draft.error}`)
          continue
        }
        const row = await cloud.addDocument({
          title: draft.title,
          body_html: draft.body_html,
        })
        if (!row) {
          failures.push(`${draft.title}: could not create cloud document.`)
        }
      }
      if (failures.length > 0) {
        setUploadError(failures.slice(0, 4).join('\n'))
      }
    } finally {
      setUploading(false)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="notion-page">
        <p className="notion-sidebar-docs-hint">Supabase is not configured. Set env vars to use the cloud workspace.</p>
        <Link href="/platform">Back to workspace demo</Link>
      </main>
    )
  }

  if (!sessionReady) {
    return (
      <main className="notion-page notion-page--workspace-cloud">
        <p className="notion-sidebar-docs-hint">Loading…</p>
      </main>
    )
  }

  return (
    <main className="notion-page notion-page--workspace-cloud">
      <div className="notion-shell notion-shell--with-agent">
        <aside className="notion-sidebar" aria-label="Cloud workspace sidebar">
          <input
            ref={fileInputRef}
            type="file"
            className="notion-sidebar-folder-input-hidden"
            tabIndex={-1}
            aria-hidden
            multiple
            accept={CLOUD_WORKSPACE_UPLOAD_ACCEPT}
            onChange={onFilesSelected}
          />
          <div className="notion-sidebar-brand-row">
            <div className="notion-sidebar-brand">Cloud workspace</div>
            <div className="notion-sidebar-account">
              {accountEmail ? (
                <span className="notion-sidebar-account-email" title={accountEmail}>
                  {accountEmail}
                </span>
              ) : null}
              <button type="button" className="notion-sidebar-sign-out" onClick={() => void signOut()} aria-label="Sign out">
                Sign out
              </button>
            </div>
          </div>
          <CloudWorkspaceSidebar
            cloud={cloud}
            insightsByDoc={insights.byDocId}
            onOpenDoc={() => {}}
            onUploadClick={openUploadPicker}
            uploading={uploading}
            uploadError={uploadError}
          />
        </aside>

        <CloudWorkspaceEditor
          cloud={cloud}
          insightsByDoc={insights.byDocId}
          workspaceDocCount={insights.workspaceDocCount}
        />
      </div>
    </main>
  )
}
