import { Suspense } from 'react'
import LoginClient from './LoginClient'

function LoginFallback() {
  return (
    <div className="auth-split">
      <div className="auth-split-panel auth-split-panel--form">
        <div className="auth-card auth-card--loading" aria-busy="true">
          <p className="auth-lead">Loading…</p>
        </div>
      </div>
      <div className="auth-split-panel auth-split-panel--visual" aria-hidden="true">
        <img src="/sign.jpg" alt="" className="auth-split-image" />
      </div>
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
