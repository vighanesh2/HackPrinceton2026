'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type UploadedDoc = {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  content: string
  previewUrl: string | null
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const MAX_SNIPPET_LENGTH = 8000
const PREVIEW_LENGTH = 2500
const DOCUMENT_MAX_EDIT_LENGTH = 12000

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function isDocxFile(file: File) {
  return (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  )
}

function summarizeDocumentContent(doc: UploadedDoc) {
  const content = doc.content.trim()
  const preview =
    content.length > MAX_SNIPPET_LENGTH
      ? `${content.slice(0, MAX_SNIPPET_LENGTH)}...`
      : content

  return [
    `Document: ${doc.name}`,
    `Type: ${doc.type || 'unknown'}`,
    `Size: ${Math.round(doc.size / 1024)} KB`,
    `Content preview:`,
    preview || 'No extracted text available.',
  ].join('\n')
}

export function DocumentCursor() {
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Upload your business documents (pitch deck, financial statements, notes), then ask me questions. I will answer using your document context first.',
    },
  ])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<{
    docId: string
    content: string
    instruction: string
  } | null>(null)

  const businessContext = useMemo(() => {
    if (!docs.length) {
      return 'No documents uploaded yet.'
    }

    return docs.map(summarizeDocumentContent).join('\n\n---\n\n')
  }, [docs])

  const docStats = useMemo(() => {
    const totalBytes = docs.reduce((sum, item) => sum + item.size, 0)
    return {
      count: docs.length,
      totalMb: (totalBytes / (1024 * 1024)).toFixed(2),
    }
  }, [docs])

  const selectedDoc = useMemo(
    () => docs.find((doc) => doc.id === selectedDocId) ?? docs[0] ?? null,
    [docs, selectedDocId]
  )

  useEffect(() => {
    return () => {
      docs.forEach((doc) => {
        if (doc.previewUrl) {
          URL.revokeObjectURL(doc.previewUrl)
        }
      })
    }
  }, [docs])

  async function onUpload(files: FileList | null) {
    if (!files?.length) return

    const nextDocs: UploadedDoc[] = []
    for (const file of Array.from(files)) {
      let content = ''
      const isPdf = isPdfFile(file)
      const isDocx = isDocxFile(file)
      try {
        if (isPdf) {
          content = ''
        } else if (isDocx) {
          const mammoth = await import('mammoth/mammoth.browser')
          const buffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({ arrayBuffer: buffer })
          content = result.value.trim()
        } else {
          content = await file.text()
        }
      } catch (uploadError) {
        content = `Unable to preview "${file.name}" in browser.`
      }

      nextDocs.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        content,
        previewUrl: isPdf ? URL.createObjectURL(file) : null,
      })
    }

    setDocs((prev) => {
      const merged = [...nextDocs, ...prev]
      if (!selectedDocId && merged.length) {
        setSelectedDocId(merged[0].id)
      }
      return merged
    })
    setError(null)
  }

  function removeDocument(id: string) {
    setDocs((prev) => {
      const removing = prev.find((doc) => doc.id === id)
      if (removing?.previewUrl) {
        URL.revokeObjectURL(removing.previewUrl)
      }
      const updated = prev.filter((doc) => doc.id !== id)
      if (selectedDocId === id) {
        setSelectedDocId(updated[0]?.id ?? null)
      }
      return updated
    })
  }

  function acceptPendingDraft() {
    if (!pendingDraft) return
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === pendingDraft.docId
          ? {
              ...doc,
              content: pendingDraft.content,
            }
          : doc
      )
    )
    setPendingDraft(null)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Changes accepted. The selected document has been updated.',
      },
    ])
  }

  function discardPendingDraft() {
    setPendingDraft(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim() || isThinking) return

    const userMessage: ChatMessage = { role: 'user', content: query.trim() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setQuery('')
    setError(null)
    setIsThinking(true)

    try {
      if (editMode) {
        if (!selectedDoc) {
          throw new Error('Select a document first before requesting edits.')
        }
        if (selectedDoc.previewUrl) {
          throw new Error('PDF editing is not supported yet. Use a text document to edit by prompt.')
        }

        const response = await fetch('/api/platform/edit-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instruction: userMessage.content,
            documentName: selectedDoc.name,
            currentContent: selectedDoc.content.slice(0, DOCUMENT_MAX_EDIT_LENGTH),
          }),
        })

        const payload = (await response.json()) as
          | { revisedContent?: string; summary?: string; error?: string }
          | undefined

        if (!response.ok || !payload?.revisedContent) {
          throw new Error(payload?.error || 'Failed to generate document edits.')
        }

        setPendingDraft({
          docId: selectedDoc.id,
          content: payload.revisedContent,
          instruction: userMessage.content,
        })

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              payload.summary ||
              'I drafted changes for the selected document. Review the preview and click Accept changes to apply.',
          },
        ])
        return
      }

      const response = await fetch('/api/platform/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: nextMessages.slice(-10),
          context: businessContext,
          documents: docs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
          })),
        }),
      })

      const payload = (await response.json()) as
        | { answer?: string; error?: string }
        | undefined

      if (!response.ok || !payload?.answer) {
        throw new Error(payload?.error || 'Failed to fetch assistant response.')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: payload.answer }])
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong while asking the model.'
      setError(message)
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <section className="doc-cursor-shell">
      <header className="doc-cursor-header">
        <div>
          <Link href="/" className="doc-cursor-home-link">
            Back to Home
          </Link>
          <h1>Business Document Cursor</h1>
          <p>
            LLaMA-powered workspace for founders and finance teams. Ask questions using your
            uploaded context.
          </p>
        </div>
      </header>

      <div className="doc-cursor-grid doc-cursor-grid-3">
        <aside className="doc-cursor-panel file-manager-panel">
          <div className="panel-head">
            <h2>Files</h2>
            <span className="muted">
              {docStats.count} docs / {docStats.totalMb} MB
            </span>
          </div>

          <label className="doc-upload">
            <span>+ Add documents</span>
            <input
              type="file"
              multiple
              onChange={(event) => void onUpload(event.target.files)}
              accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            />
          </label>

          <ul className="doc-file-list">
            {docs.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  className={`doc-file-item ${selectedDoc?.id === doc.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedDocId(doc.id)}
                >
                  <span className="doc-file-name">{doc.name}</span>
                  <span className="doc-file-meta">
                    {(doc.size / 1024).toFixed(1)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
            {!docs.length && <li className="muted">No documents uploaded yet.</li>}
          </ul>
        </aside>

        <section className="doc-cursor-panel doc-preview-pane">
          <div className="panel-head">
            <h3>Preview</h3>
            {selectedDoc && (
              <button type="button" onClick={() => removeDocument(selectedDoc.id)}>
                Remove
              </button>
            )}
          </div>
          {pendingDraft && selectedDoc?.id === pendingDraft.docId && (
            <div className="draft-banner">
              <p className="muted">AI drafted edits for: {selectedDoc.name}</p>
              <div className="draft-actions">
                <button type="button" onClick={acceptPendingDraft}>
                  Accept changes
                </button>
                <button type="button" className="secondary" onClick={discardPendingDraft}>
                  Discard
                </button>
              </div>
            </div>
          )}
          {selectedDoc ? (
            <>
              <p className="doc-name">{selectedDoc.name}</p>
              {selectedDoc.previewUrl ? (
                <iframe
                  src={selectedDoc.previewUrl}
                  title={`Preview ${selectedDoc.name}`}
                  className="doc-preview-pdf"
                />
              ) : (
                <pre className="doc-preview-content doc-preview-content-main">
                  {(pendingDraft?.docId === selectedDoc.id
                    ? pendingDraft.content
                    : selectedDoc.content
                  ).trim()
                    ? (pendingDraft?.docId === selectedDoc.id
                        ? pendingDraft.content
                        : selectedDoc.content
                      ).slice(0, PREVIEW_LENGTH)
                    : 'No preview available for this file type yet.'}
                </pre>
              )}
            </>
          ) : (
            <p className="muted">Select a file to preview it here.</p>
          )}
        </section>

        <section className="doc-cursor-chat">
          <div className="chat-topbar">
            <h2>Chat</h2>
            <p className="muted">
              Cursor-style Q&amp;A with your business context ({docStats.count} docs loaded)
            </p>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                <p className="chat-role">{message.role === 'assistant' ? 'AI Analyst' : 'You'}</p>
                <p>{message.content}</p>
              </article>
            ))}
            {isThinking && (
              <article className="chat-bubble assistant">
                <p className="chat-role">AI Analyst</p>
                <p>Analyzing your context...</p>
              </article>
            )}
          </div>

          <form className="chat-form" onSubmit={onSubmit}>
            <label className="chat-mode-toggle">
              <input
                type="checkbox"
                checked={editMode}
                onChange={(event) => setEditMode(event.target.checked)}
              />
              <span>Edit selected doc with prompt (draft + accept)</span>
            </label>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                editMode
                  ? 'Example: Rewrite this as a tighter investor update and add a risks section.'
                  : 'Ask anything about your selected docs...'
              }
              rows={3}
            />
            <button type="submit" disabled={isThinking || !query.trim()}>
              {isThinking ? 'Thinking...' : editMode ? 'Draft edits' : 'Ask AI'}
            </button>
          </form>

          {error && <p className="chat-error">{error}</p>}
        </section>
      </div>
    </section>
  )
}
