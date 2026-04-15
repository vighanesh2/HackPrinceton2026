'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PlatformSidebar } from '../PlatformSidebar'
import { InputPreview } from './InputPreview'
import { inputPrompts } from './inputPrompts'

export default function InputsPlatformPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return inputPrompts
    return inputPrompts.filter((item) =>
      `${item.name} ${item.useCase} ${item.prompt}`.toLowerCase().includes(normalized)
    )
  }, [query])

  return (
    <main className="platform platform-app">
      <header className="platform-app-header">
        <Link href="/" className="platform-brand">
          Rontzen
        </Link>
      </header>

      <div className="platform-app-shell">
        <PlatformSidebar active="inputs" />

        <div className="platform-app-main">
          <label className="platform-search-wrap platform-search-inline">
            <span className="platform-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              className="platform-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inputs"
              aria-label="Search inputs"
            />
          </label>

          <ul className="platform-catalog-list">
            {filtered.map((item) => (
              <li key={item.slug}>
                <Link href={`/platform/inputs/${item.slug}`} className="platform-catalog-link">
                  <span className="platform-catalog-label">{item.name}</span>
                  <span className="platform-catalog-meta">{item.useCase}</span>
                  <InputPreview item={item} />
                </Link>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p className="platform-empty-state">No inputs match your search.</p>
          )}
        </div>
      </div>
    </main>
  )
}
