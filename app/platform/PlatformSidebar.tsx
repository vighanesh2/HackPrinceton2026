'use client'

import Link from 'next/link'

export type PlatformNavActive = 'buttons' | 'inputs' | 'cards'

type Props = {
  active: PlatformNavActive
}

export function PlatformSidebar({ active }: Props) {
  return (
    <nav className="platform-app-sidebar" aria-label="Component categories">
      <Link
        href="/platform"
        className={`platform-nav-item ${active === 'buttons' ? 'is-active' : ''}`}
      >
        Buttons
      </Link>
      <Link
        href="/platform/inputs"
        className={`platform-nav-item ${active === 'inputs' ? 'is-active' : ''}`}
      >
        Inputs
      </Link>
      <Link
        href="/platform/cards"
        className={`platform-nav-item ${active === 'cards' ? 'is-active' : ''}`}
      >
        Cards
      </Link>
    </nav>
  )
}
