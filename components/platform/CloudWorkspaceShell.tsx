'use client'

import { useCallback, useState } from 'react'
import { RichDocEditor } from '@/components/platform/RichDocEditor'
import { AgentChatPanel } from '@/components/platform/AgentChatPanel'
import type { CloudWorkspaceApi } from '@/components/platform/useCloudWorkspaceDocs'
import type { WorkspaceDocInsight } from '@/lib/platform/workspaceDocInsights'
import type { AgentFileAction } from '@/lib/platform/agent/fileAction'

function defaultInsight(): WorkspaceDocInsight {
  return {
    claimCount: 0,
    chunkCount: 0,
    openIssueCount: 0,
    hardIssueCount: 0,
    issueHints: [],
    issues: [],
    suggestions: [],
    headlineLines: [],
    relatedDocs: [],
  }
}

function formatInsightTooltip(params: { title: string; insight: WorkspaceDocInsight }): string {
  const { title, insight } = params
  const lines = [title || 'Untitled']
  if (insight.headlineLines.length > 0) {
    lines.push('—')
    insight.headlineLines.slice(0, 2).forEach((h) => lines.push(h))
  } else if (insight.issues.length > 0) {
    lines.push('—')
    insight.issues.slice(0, 2).forEach((i) => lines.push(i.summary))
  }
  lines.push(
    `Chunks: ${insight.chunkCount} · Claims: ${insight.claimCount} · Issues: ${insight.openIssueCount}`
  )
  if (insight.headlineLines.length === 0 && insight.suggestions.length > 0) {
    lines.push('—')
    insight.suggestions.slice(0, 3).forEach((s) => lines.push(`• ${s}`))
  }
  return lines.join('\n')
}

function FolderGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v3H4V5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 10h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CloudWorkspaceSidebar({
  cloud,
  insightsByDoc,
  onOpenDoc,
  onUploadClick,
  uploading = false,
  uploadError,
}: {
  cloud: CloudWorkspaceApi
  insightsByDoc: Record<string, WorkspaceDocInsight>
  onOpenDoc: () => void
  onUploadClick?: () => void
  uploading?: boolean
  uploadError?: string | null
}) {
  return (
    <div className="notion-sidebar-docs">
      <div className="notion-sidebar-docs-head">
        <span className="notion-sidebar-docs-label">Cloud docs</span>
        <div className="notion-sidebar-docs-actions">
          {onUploadClick ? (
            <button
              type="button"
              className="notion-sidebar-add-doc"
              onClick={onUploadClick}
              title="Upload PDF, Word, PowerPoint, Markdown, or text"
              aria-label="Upload documents"
              disabled={uploading}
            >
              ↑
            </button>
          ) : null}
          <button
            type="button"
            className="notion-sidebar-add-doc"
            onClick={() => void cloud.addDocument()}
            title="New cloud document"
            aria-label="New cloud document"
            disabled={uploading}
          >
            +
          </button>
        </div>
      </div>
      {cloud.loading && <p className="notion-sidebar-docs-hint">Loading…</p>}
      {uploading && <p className="notion-sidebar-docs-hint">Uploading and extracting…</p>}
      {uploadError ? <p className="notion-doc-error">{uploadError}</p> : null}
      {cloud.error && <p className="notion-doc-error">{cloud.error}</p>}
      {cloud.documents.map((doc) => {
        const ins = insightsByDoc[doc.id] ?? defaultInsight()
        const tip = formatInsightTooltip({
          title: doc.title || 'Untitled',
          insight: ins,
        })
        return (
          <div key={doc.id} className="notion-sidebar-doc-row">
            <span className="notion-doc-insight-trigger" title={tip} aria-label={`Cross-doc insights: ${doc.title || 'Untitled'}`}>
              <span className="notion-doc-insight-icon" aria-hidden>
                <FolderGlyph size={16} />
                {(ins.openIssueCount > 0 || ins.hardIssueCount > 0) && (
                  <span className="notion-doc-insight-badge">{ins.openIssueCount || '!'}</span>
                )}
              </span>
            </span>
            <button
              type="button"
              className={`notion-sidebar-item notion-sidebar-doc-item notion-sidebar-doc-item--with-insight ${
                cloud.activeId === doc.id ? 'is-active' : ''
              }`}
              onClick={() => {
                onOpenDoc()
                cloud.selectDoc(doc.id)
              }}
            >
              {doc.title || 'Untitled'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function issueSeverityClass(sev: string): string {
  const s = sev.toLowerCase()
  if (s === 'hard' || s === 'error' || s === 'critical') return 'notion-issues-item--hard'
  if (s === 'soft' || s === 'warn' || s === 'warning') return 'notion-issues-item--soft'
  return 'notion-issues-item--info'
}

type AgentPending =
  | null
  | { kind: 'edit'; docId: string; baselineTitle: string; baselineBodyHtml: string }
  | { kind: 'create'; docId: string }

export function CloudWorkspaceEditor({
  cloud,
  insightsByDoc,
  workspaceDocCount = 0,
}: {
  cloud: CloudWorkspaceApi
  insightsByDoc: Record<string, WorkspaceDocInsight>
  workspaceDocCount?: number
}) {
  const doc = cloud.activeDoc
  const [agentPending, setAgentPending] = useState<AgentPending>(null)

  const onAgentFileAction = useCallback(
    async (action: AgentFileAction) => {
      if (action.type === 'none') return
      if (action.type === 'replace_body') {
        setAgentPending({
          kind: 'edit',
          docId: action.docId,
          baselineTitle: action.baselineTitle,
          baselineBodyHtml: action.baselineBodyHtml,
        })
        cloud.updateLocalDoc(action.docId, {
          ...(action.proposedTitle != null && action.proposedTitle.trim()
            ? { title: action.proposedTitle.trim() }
            : {}),
          body_html: action.proposedBodyHtml,
        })
        return
      }
      if (action.type === 'create_document') {
        const row = await cloud.addDocument({
          title: action.proposedTitle,
          body_html: action.proposedBodyHtml,
        })
        if (row) {
          setAgentPending({ kind: 'create', docId: row.id })
        }
      }
    },
    [cloud]
  )

  const onKeepAgent = useCallback(() => {
    if (!agentPending) return
    const d = cloud.documents.find((x) => x.id === agentPending.docId)
    if (d) {
      cloud.queueSave(agentPending.docId, { title: d.title, body_html: d.body_html })
    }
    setAgentPending(null)
  }, [agentPending, cloud])

  const onUndoAgent = useCallback(() => {
    if (!agentPending) return
    if (agentPending.kind === 'edit') {
      cloud.updateLocalDoc(agentPending.docId, {
        title: agentPending.baselineTitle,
        body_html: agentPending.baselineBodyHtml,
      })
      setAgentPending(null)
      return
    }
    void cloud.deleteDocument(agentPending.docId)
    setAgentPending(null)
  }, [agentPending, cloud])

  const agentAside = (
    <aside className="notion-cloud-rail notion-cloud-rail--agent-only" aria-label="Workspace agent">
      <div className="notion-cloud-rail-inner notion-cloud-rail-inner--chat">
        <AgentChatPanel
          contextDocId={doc?.id ?? null}
          focusedDocTitle={doc?.title || 'Untitled'}
          onAgentFileAction={onAgentFileAction}
        />
      </div>
    </aside>
  )

  if (!doc) {
    return (
      <div className="notion-cloud-workspace">
        <article className="notion-cloud-editor-pane notion-doc" aria-label="Cloud workspace">
          <p className="notion-sidebar-docs-hint">
            No cloud document open. Use <strong>+</strong> to start blank, <strong>↑</strong> to upload, or ask the
            agent to draft one (pitch outline, board memo, model assumptions, etc.).
          </p>
        </article>
        {agentAside}
      </div>
    )
  }

  const activeInsight = insightsByDoc[doc.id] ?? defaultInsight()
  const editorInsightTip = formatInsightTooltip({
    title: doc.title || 'Untitled',
    insight: activeInsight,
  })

  const pendingLabel =
    agentPending?.kind === 'create'
      ? 'New document from agent — keep it or undo to delete the draft.'
      : agentPending?.kind === 'edit'
        ? 'Agent revised this file — keep or restore the previous version.'
        : null

  const skipAutosaveForAgent =
    !!agentPending &&
    agentPending.docId === doc.id &&
    (agentPending.kind === 'edit' || agentPending.kind === 'create')

  return (
    <div className="notion-cloud-workspace">
      <article className="notion-cloud-editor-pane notion-doc" aria-label={doc.title}>
        <div className="notion-doc-tools notion-blank-doc-tools">
          <div className="notion-cloud-doc-tools-copy">
            <span className="notion-blank-doc-hint">
              Cross-doc intelligence: hover the folder on the editor (background extract + scan after save). Right:
              workspace agent.
            </span>
          </div>
          <button
            type="button"
            className="notion-doc-tool-secondary"
            onClick={() => {
              if (window.confirm('Delete this document from the cloud workspace?')) {
                void cloud.deleteDocument(doc.id)
              }
            }}
          >
            Delete
          </button>
        </div>

        <input
          className="notion-title"
          placeholder="Untitled"
          value={doc.title}
          onChange={(e) => {
            const title = e.target.value
            cloud.updateLocalDoc(doc.id, { title })
            if (!skipAutosaveForAgent) {
              cloud.queueSave(doc.id, { title })
            }
          }}
        />

        <div className="notion-cloud-editor-rte-wrap">
          <RichDocEditor
            value={cloud.coerceHtml(doc.body_html)}
            onChange={(html) => {
              cloud.updateLocalDoc(doc.id, { body_html: html })
              if (!skipAutosaveForAgent) {
                cloud.queueSave(doc.id, { body_html: html })
              }
            }}
            placeholder="Write here — saves to Supabase; chunks index for retrieval, agent, and analysis."
          />
          <div className="notion-editor-insight-dock notion-editor-insight-dock--persistent" title={editorInsightTip}>
            <button type="button" className="notion-editor-insight-fab" aria-label="Cross-doc intelligence for this file">
              <FolderGlyph size={18} />
            </button>
            <div className="notion-editor-insight-popover" role="dialog" aria-label="Cross-doc intelligence">
              <p className="notion-editor-insight-popover-title">Cross-doc intelligence</p>
              {activeInsight.headlineLines.length > 0 ? (
                <div className="notion-editor-insight-headlines" aria-live="polite">
                  {activeInsight.headlineLines.map((h, i) => (
                    <p key={i} className="notion-editor-insight-headline">
                      {h}
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="notion-editor-insight-meta">
                {activeInsight.chunkCount} chunks indexed · {activeInsight.claimCount} claims ·{' '}
                {activeInsight.openIssueCount} issue(s) touch this file
                {workspaceDocCount > 0 ? ` · ${workspaceDocCount} doc(s) in workspace` : ''}
              </p>
              <div className="notion-editor-insight-suggestions">
                {activeInsight.suggestions.map((s, i) => (
                  <p key={i} className="notion-editor-insight-suggestion-line">
                    {s}
                  </p>
                ))}
              </div>
              {activeInsight.relatedDocs.length > 0 && (
                <div className="notion-editor-insight-related">
                  <span className="notion-editor-insight-related-label">Related in workspace</span>
                  <ul className="notion-editor-insight-related-list">
                    {activeInsight.relatedDocs.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className="notion-editor-insight-related-link"
                          onClick={() => cloud.selectDoc(r.id)}
                        >
                          {r.title || 'Untitled'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeInsight.issues.length > 0 && (
                <ul className="notion-editor-insight-issues">
                  {activeInsight.issues.slice(0, 4).map((i) => (
                    <li key={i.id} className={`notion-editor-insight-issue-row ${issueSeverityClass(i.severity)}`}>
                      <span className="notion-issues-badge">{i.issue_type}</span>
                      <span className="notion-editor-insight-issue-sum">{i.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {pendingLabel ? (
          <div className="notion-agent-pending-bar" role="status">
            <span className="notion-agent-pending-bar-label">{pendingLabel}</span>
            <div className="notion-agent-pending-bar-actions">
              <button type="button" className="notion-agent-pending-keep" onClick={onKeepAgent}>
                Keep
              </button>
              <button type="button" className="notion-agent-pending-undo" onClick={onUndoAgent}>
                Undo
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {agentAside}
    </div>
  )
}
