'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { Search, ExternalLink, MapPin, Globe, Loader, AlertCircle, UserCircle, Brain, Info } from 'lucide-react'

interface SearchResult {
  name: string
  snippet: string
  profile_url: string
  source: string
  title?: string
  location?: string
  initials?: string
  // AI Agent fields
  relevance?: string
  sources?: string[]
  topics?: string[]
  contact_info?: {
    emails?: Array<{ email: string; source: string }>
    calendly?: Array<{ url: string; source: string }>
    twitter?: string
    github?: string
    website?: string
    other?: Array<{ type: string; value: string; source: string }>
  }
  reasoning?: string
  role?: string
  raw_output?: boolean
}

interface SearchResponse {
  results: SearchResult[]
  query: string
  count: number
  totalResults?: number
  hasMore?: boolean
  nextStart?: number | null
  agent_used?: boolean
  error?: string
}

export default function Networking() {
  const router = useRouter()
  const [keywords, setKeywords] = useState('')
  const [site, setSite] = useState('all')
  const [location, setLocation] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [nextStart, setNextStart] = useState<number | null>(null)
  const [totalResults, setTotalResults] = useState<number>(0)
  const [useAgent, setUseAgent] = useState(false)
  const [isAgentSearch, setIsAgentSearch] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSearch = async () => {
    if (!keywords.trim()) {
      setError('Please enter keywords to search')
      return
    }

    if (!site) {
      setError('Please select a platform')
      return
    }

    setIsSearching(true)
    setError(null)
    setSearchResults([])
    setIsAgentSearch(useAgent)

    try {
      const endpoint = useAgent ? '/api/web-search-agent' : '/api/search'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.trim(),
          site: site,
          location: location || undefined,
        }),
      })

      const data: SearchResponse = await response.json()

      if (!response.ok) {
        setError(data.error || 'Search failed. Please try again.')
        return
      }

      let results = data.results || []
      if (useAgent && data.agent_used) {
        results = results.map((result: any) => ({
          name: result.name || 'Unknown',
          snippet: result.reasoning || result.relevance || 'No description available',
          profile_url: result.contact_info?.website || result.sources?.[0] || '#',
          source: result.sources?.[0]?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'web',
          title: result.role || '',
          location: location || '',
          initials: (result.name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          relevance: result.relevance,
          sources: result.sources,
          topics: result.topics,
          contact_info: result.contact_info,
          reasoning: result.reasoning,
          role: result.role,
          raw_output: result.raw_output,
        }))
      }

      setSearchResults(results)
      setLastQuery(data.query || '')
      setHasMore(data.hasMore || false)
      setNextStart(data.nextStart || null)
      setTotalResults(data.totalResults || data.count || 0)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextStart || isLoadingMore || isAgentSearch) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.trim(),
          site: site,
          location: location || undefined,
          start: nextStart,
        }),
      })

      const data: SearchResponse = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load more results.')
        return
      }

      setSearchResults((prev) => [...prev, ...(data.results || [])])
      setHasMore(data.hasMore || false)
      setNextStart(data.nextStart || null)
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading more results.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  const getSourceBadgeColor = (source: string) => {
    if (source.includes('linkedin')) return 'source-badge-linkedin'
    if (source.includes('github')) return 'source-badge-github'
    if (source.includes('twitter') || source.includes('x.com')) return 'source-badge-twitter'
    return 'source-badge-default'
  }

  const parseMarkdown = (text: string) => {
    let html = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
    
    html = html.replace(/<a[^>]*"[^>]*>/g, '')
    html = html.replace(/<\/a>/g, '')
    
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const decodedUrl = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
      const decodedText = linkText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
      const escapedUrl = decodedUrl
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
      return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="agent-markdown-link">${decodedText}</a>`
    })
    
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    
    const linkRegex = /<a[^>]*>.*?<\/a>/g
    const parts: Array<{ type: 'link' | 'text'; content: string }> = []
    let lastIndex = 0
    let match
    
    while ((match = linkRegex.exec(html)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: html.substring(lastIndex, match.index) })
      }
      parts.push({ type: 'link', content: match[0] })
      lastIndex = match.index + match[0].length
    }
    
    if (lastIndex < html.length) {
      parts.push({ type: 'text', content: html.substring(lastIndex) })
    }
    
    const processedParts = parts.map(part => {
      if (part.type === 'link') {
        return part.content
      }
      return part.content.replace(/(https?:\/\/[^\s<>"']+)/g, (url) => {
        const escapedUrl = url
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="agent-markdown-link">${url}</a>`
      })
    })
    
    return processedParts.join('')
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: '#efeeff',
      display: 'flex',
      position: 'relative'
    }}>
      {/* Left Sidebar with Icons */}
      <div style={{
        position: 'fixed',
        left: '40px',
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
        width: '48px',
        paddingTop: '40px'
      }}>
        {/* R Icon at Top */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '300',
            color: '#111827',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
          }}>
            R
          </span>
        </div>

        {/* Icons Container - Vertically Centered */}
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Home Icon */}
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M9 22V12H15V22" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* People Icon (Active) */}
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#6009de',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Document Icon */}
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17L9 11L13 15L21 7" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 7H17V11" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Logout Button at Bottom */}
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            bottom: '40px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{
        marginLeft: '128px',
        width: 'calc(100% - 128px)',
        height: '100vh',
        display: 'flex'
      }}>
        {/* Left Side - 30% - Filters */}
        <div style={{
          width: '30%',
          height: '100vh',
          backgroundColor: '#efeeff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Fixed Header */}
          <div style={{
            padding: '40px 40px 24px 40px',
            flexShrink: 0
          }}>
            <h1 style={{
              fontSize: '40px',
              fontWeight: '500',
              color: '#111827',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
            }}>
              Networking
            </h1>
          </div>

          {/* Scrollable Filters Section */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 40px 60px 40px'
          }}>
            <div className="search-vertical-layout">
              <div className="search-input-group-vertical">
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={useAgent ? "An AI agent that searches the open web to identify relevant people and how best to reach them" : "Enter keywords (e.g., software engineer, product manager)"}
                  className="search-input-vertical"
                  disabled={isSearching}
                />
                <button
                  onClick={handleSearch}
                  disabled={!keywords.trim() || isSearching}
                  className="search-button-vertical"
                >
                  {isSearching ? (
                    <Loader className="search-button-icon spinning" />
                  ) : (
                    <>
                      <Search className="search-button-icon" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>

              {/* Filters - Vertical */}
              <div className="filters-section-vertical">
                <div className="filter-group-vertical">
                  <label className="filter-label-vertical">
                    <Globe className="filter-icon" />
                    <span>Platform</span>
                  </label>
                  <select
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="filter-select-vertical"
                    disabled={isSearching}
                  >
                    <option value="all">All (LinkedIn + X)</option>
                    <option value="linkedin.com">LinkedIn</option>
                    <option value="twitter.com">Twitter/X</option>
                  </select>
                </div>

                <div className="filter-group-vertical">
                  <label className="filter-label-vertical">
                    <MapPin className="filter-icon" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., Berlin"
                    className="filter-input-vertical"
                    disabled={isSearching}
                  />
                </div>
                
                {/* AI Agent Toggle */}
                <div className="agent-toggle-vertical">
                  <div className="agent-toggle-header-vertical">
                    <Brain className="agent-icon-vertical" />
                    <label htmlFor="agent-toggle" className="agent-toggle-label-vertical">
                      Enable Web Search Agent
                    </label>
                    <div className="agent-toggle-tooltip-vertical">
                      <Info className="tooltip-icon-vertical" />
                      <span className="tooltip-text-vertical">
                        Uses AI to search the public web and analyze external sources.
                      </span>
                    </div>
                  </div>
                  <label className="toggle-switch-vertical">
                    <input
                      type="checkbox"
                      id="agent-toggle"
                      checked={useAgent}
                      onChange={(e) => setUseAgent(e.target.checked)}
                      disabled={isSearching}
                    />
                    <span className={`toggle-slider-vertical ${useAgent ? 'active' : ''}`}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - 70% - Results */}
        <div style={{
          width: '70%',
          background: 'linear-gradient(180deg, #f0efff 0%, #fdfdff 100%)',
          overflowY: 'auto',
          padding: '32px'
        }}>
          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Section */}
          {searchResults.length > 0 && (
            <div className="results-section">
              {isAgentSearch ? (
                /* AI Agent Text Format */
                <div className="agent-results-text">
                  {searchResults.map((result, index) => {
                    if (result.raw_output && result.reasoning) {
                      let cleanText = result.reasoning
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                      
                      const lines = cleanText.split('\n')
                      
                      return (
                        <div key={index} className="agent-result-block">
                          <div className="agent-result-content">
                            {lines.map((line, i) => {
                              const trimmed = line.trim()
                              if (!trimmed) return <div key={i} className="agent-line-break"></div>
                              
                              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                const content = trimmed.substring(2)
                                return (
                                  <div key={i} className="agent-bullet-point" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                                )
                              }
                              
                              const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/)
                              if (numberedMatch) {
                                return (
                                  <div key={i} className="agent-numbered-point" dangerouslySetInnerHTML={{ __html: parseMarkdown(numberedMatch[1]) }} />
                                )
                              }
                              
                              return (
                                <p key={i} dangerouslySetInnerHTML={{ __html: parseMarkdown(trimmed) }} />
                              )
                            })}
                          </div>
                          {index < searchResults.length - 1 && <div className="agent-result-divider"></div>}
                        </div>
                      )
                    }
                  
                    return (
                      <div key={index} className="agent-result-block">
                        <div className="agent-result-header">
                          <h3 className="agent-result-name">{result.name}</h3>
                          {(result.title || result.role) && (
                            <p className="agent-result-role">{result.title || result.role}</p>
                          )}
                        </div>
                        
                        {result.reasoning && (
                          <div className="agent-result-reasoning">
                            <p dangerouslySetInnerHTML={{ __html: parseMarkdown(result.reasoning) }} />
                          </div>
                        )}
                        
                        {result.relevance && (
                          <div className="agent-result-field">
                            <span className="agent-field-label">Relevance:</span>
                            <span className="agent-field-value" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.relevance) }} />
                          </div>
                        )}
                        
                        {result.topics && result.topics.length > 0 && (
                          <div className="agent-result-field">
                            <span className="agent-field-label">Topics:</span>
                            <span className="agent-field-value" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.topics.join(', ')) }} />
                          </div>
                        )}
                        
                        {result.contact_info && (
                          <div className="agent-result-contact">
                            {result.contact_info.emails && result.contact_info.emails.length > 0 && (
                              <div className="agent-contact-row">
                                <span className="agent-field-label">Email:</span>
                                {result.contact_info.emails.map((email, idx) => (
                                  <span key={idx} className="agent-contact-link-wrapper">
                                    <a href={`mailto:${email.email}`} className="agent-contact-link">
                                      {email.email}
                                    </a>
                                    <span className="agent-contact-source">({email.source})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {result.contact_info.calendly && result.contact_info.calendly.length > 0 && (
                              <div className="agent-contact-row">
                                <span className="agent-field-label">Calendly:</span>
                                {result.contact_info.calendly.map((cal, idx) => (
                                  <span key={idx} className="agent-contact-link-wrapper">
                                    <a href={cal.url} target="_blank" rel="noopener noreferrer" className="agent-contact-link">
                                      Book Meeting
                                    </a>
                                    <span className="agent-contact-source">({cal.source})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {result.contact_info.twitter && (
                              <div className="agent-contact-row">
                                <span className="agent-field-label">Twitter:</span>
                                <a 
                                  href={`https://twitter.com/${result.contact_info.twitter.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="agent-contact-link"
                                >
                                  @{result.contact_info.twitter.replace('@', '')}
                                </a>
                              </div>
                            )}
                            {result.contact_info.github && (
                              <div className="agent-contact-row">
                                <span className="agent-field-label">GitHub:</span>
                                <a 
                                  href={`https://github.com/${result.contact_info.github}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="agent-contact-link"
                                >
                                  {result.contact_info.github}
                                </a>
                              </div>
                            )}
                            {result.contact_info.website && (
                              <div className="agent-contact-row">
                                <span className="agent-field-label">Website:</span>
                                <a 
                                  href={result.contact_info.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="agent-contact-link"
                                >
                                  {result.contact_info.website}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {result.sources && result.sources.length > 0 && (
                          <div className="agent-result-sources">
                            <span className="agent-field-label">Found on:</span>
                            <span className="agent-field-value">{result.sources.join(', ')}</span>
                          </div>
                        )}
                        
                        {index < searchResults.length - 1 && <div className="agent-result-divider"></div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Regular Card Format */
                <>
                  <div className="results-header">
                    <h2 className="results-title">
                      Found {searchResults.length} of {totalResults > 0 ? totalResults : searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </h2>
                  </div>

                  <div className="people-grid">
                    {searchResults.map((result, index) => (
                      <div key={index} className="person-card">
                        <div className="person-avatar">
                          {result.initials ? (
                            <div className="avatar-initials">{result.initials}</div>
                          ) : (
                            <div className="avatar-placeholder">
                              <UserCircle className="avatar-icon" />
                            </div>
                          )}
                        </div>
                        <div className="person-info">
                          <h3 className="person-name">{result.name}</h3>
                          {result.title && (
                            <p className="person-title">{result.title}</p>
                          )}
                          {result.location && (
                            <p className="person-location">
                              <MapPin className="location-icon" />
                              {result.location}
                            </p>
                          )}
                          {result.snippet && (
                            <p className="person-snippet">{result.snippet}</p>
                          )}
                          <div className="person-footer">
                            <span className={`source-badge ${getSourceBadgeColor(result.source)}`}>
                              {result.source}
                            </span>
                            <a
                              href={result.profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-profile-button"
                            >
                              <ExternalLink className="external-link-icon" />
                              <span>View Profile</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Load More Button */}
              {hasMore && !isAgentSearch && (
                <div className="load-more-container">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="load-more-button"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader className="load-more-icon spinning" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More</span>
                        <span className="load-more-count">
                          ({totalResults - searchResults.length} more available)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Agent Search Note */}
              {isAgentSearch && (
                <div className="agent-note">
                  <Brain className="agent-note-icon" />
                  <p className="agent-note-text">
                    Results powered by AI Web Search Agent. These results are discovered from public sources across the web.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isSearching && searchResults.length === 0 && !error && (
            <div>
              <div className="results-header">
                <h2 className="results-title">Results</h2>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif'
                }}>
                  Enter keywords to discover LinkedIn and Twitter/X profiles
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
