import { Suspense } from 'react'
import LoginClient from './LoginClient'

function LoginFallback() {
  return (
    <div className="auth-card auth-card--loading" aria-busy="true">
      <p className="auth-lead">Loading…</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<LoginFallback />}>
        <LoginClient />
      </Suspense>
    </main>
  )
}
