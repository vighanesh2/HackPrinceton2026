'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type PlatformAgentPanelProps = {
  /** Plain-text excerpts from uploaded docs (already truncated by parent). */
  context: string
  documents: Array<{ id: string; name: string }>
  activeDocId: string | null
  /** When true, chat uses RAG (requires signed-in Supabase user). */
  ragEnabled: boolean
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function PlatformAgentPanel({
  context,
  documents,
  activeDocId,
  ragEnabled,
  collapsed,
  onToggleCollapsed,
}: PlatformAgentPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask about your uploaded documents—figures, narrative, or structure. Answers use the text in this workspace first.',
    },
  ])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  const docPayload = useMemo(
    () => documents.map((d) => ({ id: d.id, name: d.name })),
    [documents]
  )

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const send = useCallback(async () => {
    const text = query.trim()
    if (!text || isThinking) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setQuery('')
    setError(null)
    setIsThinking(true)

    try {
      const response = await fetch('/api/platform/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: nextMessages.slice(-10),
          context,
          documents: docPayload,
          rag: ragEnabled,
          docId: activeDocId,
        }),
      })

      const payload = (await response.json()) as { answer?: string; error?: string } | undefined
      if (!response.ok || !payload?.answer) {
        throw new Error(payload?.error || 'Assistant did not return an answer.')
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: payload.answer! }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.')
    } finally {
      setIsThinking(false)
    }
  }, [activeDocId, context, docPayload, isThinking, messages, query, ragEnabled])

  const onSubmitForm = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void send()
    },
    [send]
  )

  if (collapsed) {
    return (
      <aside className="notion-agent-panel notion-agent-panel--collapsed" aria-label="AI agent">
        <button
          type="button"
          className="notion-agent-panel-expand"
          onClick={onToggleCollapsed}
          title="Open AI agent"
          aria-expanded={false}
        >
          <span className="notion-agent-panel-expand-label">Agent</span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="notion-agent-panel" aria-label="AI agent">
      <div className="notion-agent-panel-head">
        <h2 className="notion-agent-panel-title">Agent</h2>
        <button
          type="button"
          className="notion-agent-panel-collapse"
          onClick={onToggleCollapsed}
          title="Collapse panel"
          aria-expanded
        >
          →
        </button>
      </div>
      <p className="notion-agent-panel-meta">
        {documents.length} file{documents.length === 1 ? '' : 's'}
        {ragEnabled ? ' · RAG on' : ' · Deck context'}
      </p>
      <div className="notion-agent-panel-messages" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`notion-agent-msg notion-agent-msg--${m.role}`}
          >
            <span className="notion-agent-msg-role">{m.role === 'user' ? 'You' : 'Agent'}</span>
            <div className="notion-agent-msg-body">{m.content}</div>
          </div>
        ))}
        {isThinking ? (
          <div className="notion-agent-msg notion-agent-msg--assistant">
            <span className="notion-agent-msg-role">Agent</span>
            <div className="notion-agent-msg-body notion-agent-msg-thinking">Thinking…</div>
          </div>
        ) : null}
        <div ref={listEndRef} />
      </div>
      {error ? (
        <p className="notion-agent-panel-error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="notion-agent-panel-form" onSubmit={onSubmitForm}>
        <textarea
          className="notion-agent-panel-input"
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about this workspace…"
          disabled={isThinking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
        />
        <button type="submit" className="notion-agent-panel-send" disabled={isThinking || !query.trim()}>
          Send
        </button>
      </form>
    </aside>
  )
}
