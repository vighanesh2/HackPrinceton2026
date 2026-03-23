'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setShowConfirmation(true)
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex'
    }}>
      {/* Left Side - Big R */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#efeeff'
      }}>
        <div style={{
          fontSize: '280px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
          lineHeight: '1'
        }}>
          R
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '40px',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
          }}>
            Create your account
          </h1>

          {showConfirmation && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '8px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontSize: '14px',
              marginBottom: '24px',
              width: '100%',
              textAlign: 'center'
            }}>
              A confirmation link has been sent to your {email}
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '20px',
              width: '100%'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%'
          }}>
            {/* Email Field */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
              }}>
                E-mail
              </label>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  fontSize: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
                  color: '#111827',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  fontSize: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
                  color: '#111827',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                marginTop: '8px',
                padding: '14px 24px',
                borderRadius: '9999px',
                backgroundColor: '#1f2937',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
                transition: 'background-color 0.2s',
                textTransform: 'uppercase',
                width: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111827'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{
              color: '#c4673a',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}