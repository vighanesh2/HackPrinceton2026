'use client'

import { useState, useEffect } from 'react'
import { Twitter, CheckCircle2, Clock, AlertCircle, Settings, Calendar } from 'lucide-react'
import Link from 'next/link'

interface XConnection {
  connected: boolean
  username?: string
  lastPost?: string
}

interface PostHistory {
  id: string
  post_text: string
  posted_at: string
  status: 'success' | 'failed' | 'pending'
  x_post_id?: string
}

export default function PostAgentPage() {
  const [xConnection, setXConnection] = useState<XConnection>({ connected: false })
  const [postHistory, setPostHistory] = useState<PostHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [startupProfile, setStartupProfile] = useState<any>(null)
  const [postTime, setPostTime] = useState('09:00')
  const [timezone, setTimezone] = useState('UTC')
  const [savingTime, setSavingTime] = useState(false)

  useEffect(() => {
    // Check URL parameters for connection status
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const username = urlParams.get('username')
    const error = urlParams.get('error')
    
    if (connected === 'true') {
      // Show success state immediately with username from URL
      setXConnection({ 
        connected: true,
        username: username || undefined
      })
      // Clean up URL
      window.history.replaceState({}, '', '/post-agent')
      // Then check actual status from API (which will use cookie)
      checkXConnection()
    } else if (error) {
      // Show error message
      alert(`Connection failed: ${error}`)
      // Clean up URL
      window.history.replaceState({}, '', '/post-agent')
      checkXConnection()
    } else {
      // Normal status check
      checkXConnection()
    }
    
    // Load post history
    loadPostHistory()
    // Load startup profile
    loadStartupProfile()
    // Load posting schedule
    loadPostingSchedule()
    
    // Detect user timezone
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setTimezone(userTimezone)
    } catch (e) {
      // Fallback to UTC
      setTimezone('UTC')
    }
  }, [])

  const checkXConnection = async () => {
    try {
      const response = await fetch('/api/post-agent/x-status')
      const data = await response.json()
      setXConnection(data)
    } catch (error) {
      console.error('Error checking X connection:', error)
    }
  }

  const loadPostHistory = async () => {
    try {
      const response = await fetch('/api/post-agent/history')
      const data = await response.json()
      setPostHistory(data.posts || [])
    } catch (error) {
      console.error('Error loading post history:', error)
    }
  }

  const loadStartupProfile = async () => {
    try {
      const response = await fetch('/api/post-agent/profile')
      const data = await response.json()
      setStartupProfile(data.profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const connectX = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/post-agent/x-connect', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data.details || data.error || 'Failed to initiate X connection'
        alert(`Error: ${errorMsg}\n\nPlease check your .env.local file and make sure:\n- X_CLIENT_ID is set\n- X_REDIRECT_URI is set to http://localhost:3000/api/post-agent/x-callback\n- NEXT_PUBLIC_APP_URL is set to http://localhost:3000`)
        console.error('X connect error:', data)
        return
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        alert('No auth URL returned. Please check server logs.')
      }
    } catch (error) {
      console.error('Error connecting X:', error)
      alert('Failed to initiate X connection. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const disconnectX = async () => {
    if (!confirm('Are you sure you want to disconnect your X account?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/post-agent/x-disconnect', { method: 'POST' })
      if (response.ok) {
        setXConnection({ connected: false })
      }
    } catch (error) {
      console.error('Error disconnecting X:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPostingSchedule = async () => {
    try {
      const response = await fetch('/api/post-agent/schedule')
      const data = await response.json()
      if (data.postTime) {
        // Convert HH:mm:ss to HH:mm format for input
        const timeParts = data.postTime.split(':')
        if (timeParts.length >= 2) {
          setPostTime(`${timeParts[0]}:${timeParts[1]}`)
        }
      }
      if (data.timezone) {
        setTimezone(data.timezone)
      }
    } catch (error) {
      console.error('Error loading posting schedule:', error)
    }
  }

  const savePostingTime = async () => {
    if (!xConnection.connected) {
      alert('Please connect your X account first')
      return
    }
    
    setSavingTime(true)
    try {
      const response = await fetch('/api/post-agent/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postTime: postTime,
          timezone: timezone,
        }),
      })
      
      const data = await response.json()
      if (response.ok) {
        alert('Posting time updated successfully!')
      } else {
        alert(data.error || 'Failed to update posting time')
      }
    } catch (error) {
      console.error('Error saving posting time:', error)
      alert('Failed to save posting time')
    } finally {
      setSavingTime(false)
    }
  }

  const testPost = async () => {
    if (!confirm('This will generate and post a test tweet. Continue?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/post-agent/test-post', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        alert('Test post created! Check your X account.')
        loadPostHistory()
      } else {
        const errorMsg = data.details 
          ? `${data.error}\n\n${data.details}` 
          : data.error || 'Failed to create test post'
        alert(errorMsg)
      }
    } catch (error) {
      console.error('Error creating test post:', error)
      alert('Failed to create test post. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-agent-page">
      <div className="post-agent-container">
        <div className="post-agent-header">
          <div className="header-content">
            <div className="header-icon">
              <Twitter className="icon" size={32} />
            </div>
            <div>
              <h1>X Posting Agent</h1>
              <p>Automated daily posts for your startup</p>
            </div>
          </div>
          <Link href="/" className="back-link">← Back to Home</Link>
        </div>

        {/* X Connection Status */}
        <div className="status-card">
          <div className="status-header">
            <h2>X Account Connection</h2>
            {xConnection.connected ? (
              <span className="status-badge connected">
                <CheckCircle2 size={16} />
                Connected
              </span>
            ) : (
              <span className="status-badge disconnected">
                <AlertCircle size={16} />
                Not Connected
              </span>
            )}
          </div>
          
          {xConnection.connected ? (
            <div className="connection-info">
              <p><strong>Username:</strong> @{xConnection.username || 'Loading...'}</p>
              {xConnection.lastPost && (
                <p><strong>Last Post:</strong> {new Date(xConnection.lastPost).toLocaleDateString()}</p>
              )}
              <div className="action-buttons">
                <button onClick={disconnectX} className="btn btn-secondary" disabled={loading}>
                  Disconnect
                </button>
                <button onClick={testPost} className="btn btn-primary" disabled={loading}>
                  Test Post Now
                </button>
              </div>
            </div>
          ) : (
            <div className="connection-info">
              <p>Connect your X account to enable automated daily posting.</p>
              <button onClick={connectX} className="btn btn-primary" disabled={loading}>
                <Twitter size={18} />
                Connect X Account
              </button>
            </div>
          )}
        </div>

        {/* Posting Schedule */}
        <div className="status-card">
          <div className="status-header">
            <h2>
              <Calendar size={20} />
              Posting Schedule
            </h2>
            {xConnection.connected && (
              <span className="status-badge connected">
                <CheckCircle2 size={16} />
                Active
              </span>
            )}
          </div>
          <div className="schedule-info">
            <p><strong>Frequency:</strong> One post per day</p>
            
            {xConnection.connected ? (
              <div className="time-selector">
                <div className="time-input-group">
                  <label htmlFor="post-time" className="time-label">
                    <strong>Post Time:</strong>
                  </label>
                  <div className="time-input-wrapper">
                    <input
                      type="time"
                      id="post-time"
                      value={postTime}
                      onChange={(e) => setPostTime(e.target.value)}
                      className="time-input"
                      disabled={savingTime}
                    />
                    <span className="timezone-badge">{timezone}</span>
                  </div>
                </div>
                <button
                  onClick={savePostingTime}
                  className="btn btn-primary"
                  disabled={savingTime}
                >
                  {savingTime ? 'Saving...' : 'Save Time'}
                </button>
              </div>
            ) : (
              <p><strong>Time:</strong> Set after connecting X account</p>
            )}
            
            <p><strong>Status:</strong> {xConnection.connected ? 'Active' : 'Inactive - Connect X to enable'}</p>
          </div>
        </div>

        {/* Startup Profile */}
        {startupProfile && (
          <div className="status-card">
            <div className="status-header">
              <h2>
                <Settings size={20} />
                Startup Profile
              </h2>
            </div>
            <div className="profile-info">
              <p><strong>Company:</strong> {startupProfile.company_name || 'Not set'}</p>
              <p><strong>Industry:</strong> {startupProfile.industry || 'Not set'}</p>
              <p><strong>Description:</strong> {startupProfile.description || 'Not set'}</p>
              <Link href="/questionnaire" className="edit-link">Edit Profile →</Link>
            </div>
          </div>
        )}

        {/* Post History */}
        <div className="status-card">
          <div className="status-header">
            <h2>
              <Clock size={20} />
              Post History
            </h2>
          </div>
          {postHistory.length === 0 ? (
            <div className="empty-state">
              <p>No posts yet. Posts will appear here after they're published.</p>
            </div>
          ) : (
            <div className="post-history">
              {postHistory.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-header">
                    <span className={`post-status ${post.status}`}>
                      {post.status === 'success' && <CheckCircle2 size={14} />}
                      {post.status === 'failed' && <AlertCircle size={14} />}
                      {post.status === 'pending' && <Clock size={14} />}
                      {post.status}
                    </span>
                    <span className="post-date">
                      {new Date(post.posted_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="post-text">{post.post_text}</p>
                  {post.x_post_id && (
                    <a 
                      href={`https://x.com/i/web/status/${post.x_post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="post-link"
                    >
                      View on X →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Architecture Info */}
        <div className="info-card">
          <h3>How It Works</h3>
          <ol className="info-list">
            <li>Connect your X account via OAuth (one-time setup)</li>
            <li>Choose your preferred posting time (one post per day)</li>
            <li>Your startup profile powers AI-generated posts</li>
            <li>Daily scheduler triggers n8n workflow at your chosen time</li>
            <li>n8n generates post using AI and publishes to X</li>
            <li>Post history is saved in Supabase</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

