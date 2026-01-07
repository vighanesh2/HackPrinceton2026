'use client'

import { useState } from 'react'
import Header from '@/components/Header'
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

export default function MarketInsights() {
  const [keywords, setKeywords] = useState('')
  const [site, setSite] = useState('all') // Default to All
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
      // Use AI Agent if enabled, otherwise use regular search
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

      // Transform agent results to match SearchResult format if needed
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

      // Append new results to existing ones
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

  return (
    <>
      <div className="main-wrapper prototype-builder-layout">
        <Header />
        <div className="market-insights-container">
          <div className="market-insights-split-layout">
            {/* Left Sidebar - Search Section */}
            <div className="market-insights-sidebar">
              <div className="search-section">
                <div className="search-section-header">
                  <h1 className="search-section-title">Market Insights</h1>
                </div>
                
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

            {/* Right Side - Results */}
            <div className="market-insights-results">
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
                  /* AI Agent Text Format - Notion Style */
                  <div className="agent-results-text">
                    {(() => {
                      // Helper function to parse markdown and render it
                      const parseMarkdown = (text: string) => {
                        // First, decode any HTML entities that might be in the text
                        let html = text
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&')
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/&nbsp;/g, ' ')
                        
                        // Remove any existing HTML tags that might be malformed (like broken <a> tags)
                        // This handles cases where HTML is already in the text but broken
                        html = html.replace(/<a[^>]*"[^>]*>/g, '') // Remove broken <a> tags
                        html = html.replace(/<\/a>/g, '') // Remove closing </a> tags
                        
                        // Now escape any remaining raw HTML to prevent XSS, but we'll add our own
                        html = html
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                        
                        // Then convert markdown to HTML
                        // Convert markdown links [text](url) to HTML links
                        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
                          // Decode entities in URL and text
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
                          // Escape the URL for HTML attribute
                          const escapedUrl = decodedUrl
                            .replace(/&/g, '&amp;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;')
                          return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="agent-markdown-link">${decodedText}</a>`
                        })
                        
                        // Convert **bold** to <strong>
                        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        
                        // Convert *italic* to <em> (but not if it's part of **)
                        html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
                        
                        // Convert plain URLs to links (but not if already in a link)
                        // Split by existing links first
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
                        
                        // Process only text parts for URL conversion
                        const processedParts = parts.map(part => {
                          if (part.type === 'link') {
                            return part.content
                          }
                          // Convert URLs in text parts
                          return part.content.replace(/(https?:\/\/[^\s<>"']+)/g, (url) => {
                            // Escape URL for HTML attribute
                            const escapedUrl = url
                              .replace(/&/g, '&amp;')
                              .replace(/"/g, '&quot;')
                              .replace(/'/g, '&#39;')
                            return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="agent-markdown-link">${url}</a>`
                          })
                        })
                        
                        return processedParts.join('')
                      }
                      
                      return searchResults.map((result, index) => {
                        // Handle raw output (just text)
                        if (result.raw_output && result.reasoning) {
                          // Clean the text first - remove any existing HTML that might be escaped
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
                                  
                                  // Handle bullet points
                                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                    const content = trimmed.substring(2)
                                    return (
                                      <div key={i} className="agent-bullet-point" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                                    )
                                  }
                                  
                                  // Handle numbered lists
                                  const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/)
                                  if (numberedMatch) {
                                    return (
                                      <div key={i} className="agent-numbered-point" dangerouslySetInnerHTML={{ __html: parseMarkdown(numberedMatch[1]) }} />
                                    )
                                  }
                                  
                                  // Regular paragraph
                                  return (
                                    <p key={i} dangerouslySetInnerHTML={{ __html: parseMarkdown(trimmed) }} />
                                  )
                                })}
                              </div>
                              {index < searchResults.length - 1 && <div className="agent-result-divider"></div>}
                            </div>
                          )
                        }
                      
                      // Handle structured results
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
                    })
                    })()}
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

                {/* Load More Button - Only show for regular search, not agent */}
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
                <div className="empty-state">
                  <Search className="empty-state-icon" />
                  <h3 className="empty-state-title">Start Your Search</h3>
                  <p className="empty-state-text">
                    Enter keywords to discover LinkedIn and Twitter/X profiles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

