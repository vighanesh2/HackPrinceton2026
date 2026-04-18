'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

type Mode = 'signin' | 'signup'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next')
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
    return '/platform'
  }, [searchParams])

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const configured = isSupabaseConfigured()

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)

    if (!configured) {
      setMessage(
        'Supabase environment variables are not set. Copy .env.example to .env.local and add your project keys.'
      )
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        })
        if (error) {
          setMessage(error.message)
          return
        }
        setMessage('Check your email to confirm your account, then sign in.')
        setMode('signin')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
        return
      }
      router.push(nextPath)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <Link href="/" className="auth-brand">
        Rontzen
      </Link>
      <h1 className="auth-title">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
      <p className="auth-lead">Use the email and password you configured in Supabase Auth.</p>

      {!configured && (
        <p className="auth-banner" role="status">
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
          <code>.env.local</code>, then restart the dev server.
        </p>
      )}

      {searchParams.get('error') === 'auth' && (
        <p className="auth-error" role="alert">
          Sign-in link expired or is invalid. Try again.
        </p>
      )}
      {searchParams.get('error') === 'config' && (
        <p className="auth-error" role="alert">
          Server is missing Supabase configuration.
        </p>
      )}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="auth-field">
          <span className="auth-label">Password</span>
          <input
            className="auth-input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {message && (
          <p className={message.includes('Check your email') ? 'auth-success' : 'auth-error'} role="status">
            {message}
          </p>
        )}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'signin' ? (
          <>
            New here?{' '}
            <button type="button" className="auth-link-button" onClick={() => setMode('signup')}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" className="auth-link-button" onClick={() => setMode('signin')}>
              Sign in
            </button>
          </>
        )}
      </p>

      <Link href="/" className="auth-back">
        ← Back to home
      </Link>
    </div>
  )
}
