'use client'

import Link from 'next/link'
import { DocFinLogoLink } from '@/components/DocFinLogoLink'

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  const parts = local.split(/[._\-+]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase()
  }
  const compact = local.replace(/[^a-zA-Z0-9]/g, '')
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase()
  if (compact.length === 1) return compact.toUpperCase()
  return '?'
}

type PlatformTopBarProps = {
  supabaseConfigured: boolean
  accountEmail: string | null
  onSignOut: () => void
}

export function PlatformTopBar({ supabaseConfigured, accountEmail, onSignOut }: PlatformTopBarProps) {
  return (
    <header className="platform-topbar">
      <div className="platform-topbar-inner">
        <DocFinLogoLink
          className="platform-topbar-logo"
          iconClassName="platform-topbar-logo-icon"
          brandClassName="platform-topbar-logo-brand"
        />

        <div className="platform-topbar-actions">
          {supabaseConfigured && accountEmail ? (
            <>
              <span
                className="platform-topbar-avatar"
                title={accountEmail}
                aria-label={`Signed in as ${accountEmail}`}
              >
                {initialsFromEmail(accountEmail)}
              </span>
              <button type="button" className="platform-topbar-sign-out" onClick={() => void onSignOut()}>
                Sign out
              </button>
            </>
          ) : supabaseConfigured ? (
            <Link href="/login" className="platform-topbar-sign-in">
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
