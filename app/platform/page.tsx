'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ButtonPreview } from './ButtonPreview'
import { buttonPrompts } from './buttonPrompts'
import { PlatformSidebar } from './PlatformSidebar'

export default function PlatformPage() {
  const [query, setQuery] = useState('')

  const filteredButtons = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return buttonPrompts
    return buttonPrompts.filter((item) =>
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
        <PlatformSidebar active="buttons" />

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
              placeholder="Search buttons"
              aria-label="Search buttons"
            />
          </label>

          <ul className="platform-catalog-list">
            {filteredButtons.map((item) => (
              <li key={item.slug}>
                <Link href={`/platform/${item.slug}`} className="platform-catalog-link">
                  <span className="platform-catalog-label">{item.name}</span>
                  <span className="platform-catalog-meta">{item.useCase}</span>
                  <ButtonPreview item={item} />
                </Link>
              </li>
            ))}
          </ul>
          {filteredButtons.length === 0 && (
            <p className="platform-empty-state">No buttons match your search.</p>
          )}
        </div>
      </div>
    </main>
  )
}
