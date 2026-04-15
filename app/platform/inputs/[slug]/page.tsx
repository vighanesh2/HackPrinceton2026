'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PlatformSidebar } from '../../PlatformSidebar'
import { InputPreview } from '../InputPreview'
import { inputPrompts } from '../inputPrompts'

type PageProps = {
  params: { slug: string }
}

export default function InputPromptDetailPage({ params }: PageProps) {
  const [copied, setCopied] = useState(false)
  const item = inputPrompts.find((entry) => entry.slug === params.slug)

  if (!item) {
    return (
      <main className="platform platform-app">
        <header className="platform-app-header">
          <Link href="/" className="platform-brand">
            Rontzen
          </Link>
        </header>
        <p className="platform-detail-miss">This input was not found.</p>
        <Link href="/platform/inputs" className="platform-detail-backlink">
          Browse inputs
        </Link>
      </main>
    )
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="platform platform-app">
      <header className="platform-app-header">
        <Link href="/" className="platform-brand">
          Rontzen
        </Link>
      </header>

      <div className="platform-app-shell">
        <PlatformSidebar active="inputs" />

        <div className="platform-app-main platform-detail-main">
          <div className="platform-detail-head">
            <h1 className="platform-detail-title">{item.name}</h1>
            <p className="platform-detail-sub">{item.useCase}</p>
          </div>

          <div className="platform-detail-preview-wrap" aria-label={`${item.name} preview`}>
            <InputPreview item={item} />
          </div>

          <div className="platform-detail-api">
            <div className="platform-detail-api-row">
              <span className="platform-detail-api-label">Prompt</span>
              <button
                type="button"
                className="platform-copy-icon-btn"
                onClick={copyPrompt}
                aria-label="Copy prompt"
                title="Copy prompt"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M8 8V6a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2h-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <rect
                    x="4"
                    y="8"
                    width="10"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
            <p className="platform-detail-prompt">{item.prompt}</p>
            <p className="platform-copy-status" role="status">
              {copied ? 'Copied' : ''}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
