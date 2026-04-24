'use client'

import DOMPurify from 'isomorphic-dompurify'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { aiMarkdownToEditorHtml } from '@/components/platform/editorHtml'
import type { AgentConversationRow, AgentMessageRow } from '@/lib/platform/agentChatTypes'
import type { AgentFileAction } from '@/lib/platform/agent/fileAction'

function assistantMarkdownToSafeHtml(md: string): string {
  const raw = aiMarkdownToEditorHtml(md)
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}

type AgentRagPayload = {
  chunkCount: number
  queryTooShort: boolean
  fallbackExcerptApplied: boolean
  sources: Array<{ sourceIndex: number; chunkId: string; docId: string; preview: string }>
}

function tabLabel(title: string | undefined, max = 22): string {
  const t = (title || 'Chat').trim() || 'Chat'
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/**
 * Workspace-wide agent (Cursor-style): threads persist when you switch files.
 * `contextDocId` / `focusedDocTitle` are the open file for RAG + Apply for this moment.
 */
function fileActionFromPayload(raw: unknown): AgentFileAction | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const a = raw as AgentFileAction
  if (a.type === 'none') return a
  if (a.type === 'replace_body' && typeof (a as { docId?: string }).docId === 'string') return a
  if (a.type === 'create_document' && typeof (a as { proposedTitle?: string }).proposedTitle === 'string') return a
  return undefined
}

export function AgentChatPanel({
  contextDocId,
  focusedDocTitle,
  onApplyToDocument,
  onAgentFileAction,
}: {
  contextDocId: string | null
  focusedDocTitle: string
  onApplyToDocument?: (markdownFromAssistant: string) => void
  onAgentFileAction?: (action: AgentFileAction) => void | Promise<void>
}) {
  const [conversations, setConversations] = useState<AgentConversationRow[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AgentMessageRow[]>([])
  const [composer, setComposer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  const loadConversations = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/agent/conversations')
      const raw = await res.text()
      let payload: { conversations?: AgentConversationRow[]; error?: string } = {}
      try {
        payload = JSON.parse(raw) as typeof payload
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
      const list = payload.conversations ?? []
      setConversations(list)
      setActiveConversationId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load chats.')
      setConversations([])
      setActiveConversationId(null)
    } finally {
      setLoadingList(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true)
    setError(null)
    try {
      const res = await fetch(`/api/platform/agent/conversations/${conversationId}/messages`)
      const raw = await res.text()
      let payload: { messages?: AgentMessageRow[]; error?: string } = {}
      try {
        payload = JSON.parse(raw) as typeof payload
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
      setMessages(payload.messages ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load messages.')
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (activeConversationId) {
      void loadMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId, loadMessages])

  useLayoutEffect(() => {
    const el = activeTabRef.current
    const sc = tabsScrollRef.current
    if (el && sc) {
      const er = el.getBoundingClientRect()
      const sr = sc.getBoundingClientRect()
      if (er.left < sr.left) sc.scrollLeft -= sr.left - er.left + 8
      else if (er.right > sr.right) sc.scrollLeft += er.right - sr.right + 8
    }
  }, [activeConversationId, conversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function createNewChat() {
    setError(null)
    const stamp = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    try {
      const res = await fetch('/api/platform/agent/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Chat · ${stamp}` }),
      })
      const raw = await res.text()
      let payload: { conversation?: AgentConversationRow; error?: string } = {}
      try {
        payload = JSON.parse(raw) as typeof payload
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
      const c = payload.conversation
      if (!c) throw new Error('No conversation returned.')
      setConversations((prev) => [c, ...prev].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)))
      setActiveConversationId(c.id)
      setMessages([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start chat.')
    }
  }

  async function deleteConversation(id: string) {
    if (!window.confirm('Delete this chat tab and its messages?')) return
    setError(null)
    try {
      const res = await fetch(`/api/platform/agent/conversations/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t.slice(0, 200) || `HTTP ${res.status}`)
      }
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id)
        if (activeConversationId === id) {
          setActiveConversationId(next[0]?.id ?? null)
        }
        return next
      })
      if (activeConversationId === id) {
        setMessages([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  async function sendMessage() {
    const text = composer.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/platform/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          docId: contextDocId,
          conversationId: activeConversationId,
        }),
      })
      const raw = await res.text()
      let payload: {
        answer?: string
        error?: string
        rag?: AgentRagPayload
        fileAction?: unknown
        conversationId?: string | null
        conversationError?: string
        persistError?: string
      } = {}
      try {
        payload = JSON.parse(raw) as typeof payload
      } catch {
        throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`)
      }
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`)
      if (payload.conversationError) {
        setError(`Reply delivered but chat not saved: ${payload.conversationError}`)
      }
      if (payload.conversationId && payload.conversationId !== activeConversationId) {
        setActiveConversationId(payload.conversationId)
      }
      const fa = fileActionFromPayload(payload.fileAction)
      if (fa && fa.type !== 'none' && onAgentFileAction) {
        await onAgentFileAction(fa)
      }
      setComposer('')
      if (payload.conversationId) {
        await loadMessages(payload.conversationId)
      }
      await loadConversations()
      if (payload.persistError) {
        setError(`Reply shown but save failed: ${payload.persistError}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Agent failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="notion-agent-chat" aria-label="Workspace agent">
      <p
        className="notion-agent-chat-doc-scope"
        title="Same chat across files. Edits target whichever file is open here."
      >
        <span className="notion-agent-chat-doc-scope-label">Focused file</span>
        <span className="notion-agent-chat-doc-scope-name">
          {contextDocId ? focusedDocTitle || 'Untitled' : 'No document open'}
        </span>
      </p>

      <div className="notion-agent-chat-tabbar" role="tablist" aria-label="Agent chat threads">
        <div className="notion-agent-chat-tabs-scroll" ref={tabsScrollRef}>
          {loadingList && conversations.length === 0 ? (
            <span className="notion-agent-chat-tabs-loading">Loading tabs…</span>
          ) : null}
          {conversations.map((c) => {
            const active = c.id === activeConversationId
            return (
              <div
                key={c.id}
                className={`notion-agent-chat-tab ${active ? 'is-active' : ''}`}
                role="presentation"
              >
                <button
                  type="button"
                  ref={active ? activeTabRef : undefined}
                  role="tab"
                  aria-selected={active}
                  className="notion-agent-chat-tab-main"
                  onClick={() => setActiveConversationId(c.id)}
                  title={c.title || 'Chat'}
                >
                  {tabLabel(c.title)}
                </button>
                <button
                  type="button"
                  className="notion-agent-chat-tab-close"
                  aria-label={`Delete ${c.title || 'chat'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    void deleteConversation(c.id)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          className="notion-agent-chat-tab-new"
          onClick={() => void createNewChat()}
          title="New chat tab"
          aria-label="New chat tab"
        >
          +
        </button>
      </div>

      <p className="notion-agent-dock-hint notion-agent-chat-hint">
        Like Cursor: ask anything in chat, or say <strong>fix / rewrite / add a section</strong> to edit the open file.
        New drafts get <strong>Keep</strong> or <strong>Undo</strong> under the editor. With no docs yet, describe what
        to create (deck outline, memo, model assumptions).
      </p>

      <div className="notion-agent-chat-thread" role="log" aria-live="polite">
        {loadingMessages && messages.length === 0 ? (
          <p className="notion-agent-chat-loading">Loading messages…</p>
        ) : null}
        {!loadingMessages && messages.length === 0 && !busy ? (
          <p className="notion-agent-chat-empty">
            Ask a question, request an edit on the open file, or describe a new financial doc to add to the workspace.
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`notion-agent-chat-bubble notion-agent-chat-bubble--${m.role}`}
          >
            <span className="notion-agent-chat-bubble-label">{m.role === 'user' ? 'You' : 'Agent'}</span>
            <div className="notion-agent-chat-bubble-body">
              {m.role === 'user' ? <pre className="notion-agent-chat-text">{m.content}</pre> : null}
              {m.role === 'assistant' && m.metadata && typeof m.metadata === 'object' && 'rag' in m.metadata ? (
                <AssistantBlock
                  content={m.content}
                  rag={m.metadata.rag as AgentRagPayload | undefined}
                  fileAction={fileActionFromPayload((m.metadata as { fileAction?: unknown }).fileAction)}
                  onApplyToDocument={onApplyToDocument}
                />
              ) : m.role === 'assistant' ? (
                <AssistantBlock content={m.content} onApplyToDocument={onApplyToDocument} />
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="notion-agent-chat-bubble notion-agent-chat-bubble--assistant">
            <span className="notion-agent-chat-bubble-label">Agent</span>
            <p className="notion-agent-chat-typing">Thinking…</p>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="notion-doc-error notion-agent-chat-error">{error}</p> : null}

      <div className="notion-agent-chat-composer">
        <textarea
          className="notion-agent-input notion-agent-chat-input"
          rows={3}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          value={composer}
          disabled={busy}
          onChange={(e) => setComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void sendMessage()
            }
          }}
        />
        <button
          type="button"
          className="notion-agent-submit"
          disabled={busy || !composer.trim()}
          onClick={() => void sendMessage()}
        >
          {busy ? 'Running…' : 'Send'}
        </button>
      </div>
    </section>
  )
}

function AssistantBlock({
  content,
  rag,
  fileAction,
  onApplyToDocument,
}: {
  content: string
  rag?: AgentRagPayload
  fileAction?: AgentFileAction
  onApplyToDocument?: (markdownFromAssistant: string) => void
}) {
  const hideApply =
    !!fileAction && (fileAction.type === 'replace_body' || fileAction.type === 'create_document')
  const html = useMemo(() => assistantMarkdownToSafeHtml(content), [content])
  return (
    <>
      {rag && (rag.chunkCount > 0 || rag.sources.length > 0) ? (
        <div className="notion-agent-rag-meta notion-agent-rag-meta--inline">
          <p>
            <strong>RAG</strong>: {rag.chunkCount} chunk(s)
            {rag.queryTooShort ? ' · query short' : ''}
            {rag.fallbackExcerptApplied ? ' · doc excerpt' : ''}
          </p>
          {rag.sources.length > 0 ? (
            <ul className="notion-agent-rag-sources">
              {rag.sources.slice(0, 4).map((s) => (
                <li key={`${s.chunkId}-${s.sourceIndex}`}>
                  <span className="notion-agent-rag-slabel">[S{s.sourceIndex}]</span> {s.preview}
                  {s.preview.length >= 180 ? '…' : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div
        className="notion-agent-chat-text notion-agent-chat-md"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {hideApply ? (
        <p className="notion-agent-chat-fileaction-hint">Use <strong>Keep</strong> or <strong>Undo</strong> under the editor.</p>
      ) : null}
      {onApplyToDocument && content.trim() && !hideApply ? (
        <div className="notion-agent-chat-apply-wrap">
          <button
            type="button"
            className="notion-agent-chat-apply-btn"
            onClick={() => onApplyToDocument(content)}
          >
            Insert into document
          </button>
        </div>
      ) : null}
    </>
  )
}
