'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { Search, ExternalLink, MapPin, Globe, Loader, AlertCircle, UserCircle } from 'lucide-react'

interface SearchResult {
  name: string
  snippet: string
  profile_url: string
  source: string
  title?: string
  location?: string
  initials?: string
}

interface SearchResponse {
  results: SearchResult[]
  query: string
  count: number
  totalResults?: number
  hasMore?: boolean
  nextStart?: number | null
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
        }),
      })

      const data: SearchResponse = await response.json()

      if (!response.ok) {
        setError(data.error || 'Search failed. Please try again.')
        return
      }

      setSearchResults(data.results || [])
      setLastQuery(data.query || '')
      setHasMore(data.hasMore || false)
      setNextStart(data.nextStart || null)
      setTotalResults(data.totalResults || 0)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextStart || isLoadingMore) return

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
          <div className="market-insights-content">
            {/* Header */}
            <div className="insights-header">
              <div className="insights-logo">
                <Search className="insights-logo-icon" />
              </div>
              <h1 className="insights-title">Market Insights</h1>
              <p className="insights-subtitle">
                Discover LinkedIn and Twitter/X profiles
              </p>
            </div>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-input-group">
                <div className="search-icon-wrapper">
                  <Search className="search-icon" />
                </div>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter keywords (e.g., software engineer, product manager)"
                  className="search-input"
                  disabled={isSearching}
                />
                <button
                  onClick={handleSearch}
                  disabled={!keywords.trim() || isSearching}
                  className="search-button"
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

              {/* Filters */}
              <div className="filters-section">
                <div className="filter-group">
                  <label className="filter-label">
                    <Globe className="filter-icon" />
                    Platform
                  </label>
                  <select
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="filter-select"
                    disabled={isSearching}
                  >
                    <option value="all">All (LinkedIn + X)</option>
                    <option value="linkedin.com">LinkedIn</option>
                    <option value="twitter.com">Twitter/X</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    <MapPin className="filter-icon" />
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., Berlin, San Francisco"
                    className="filter-input"
                    disabled={isSearching}
                  />
                </div>
              </div>
            </div>

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

                {/* Load More Button */}
                {hasMore && (
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
              </div>
            )}

            {/* Empty State */}
            {!isSearching && searchResults.length === 0 && !error && (
              <div className="empty-state">
                <Search className="empty-state-icon" />
                <h3 className="empty-state-title">Start Your Search</h3>
                  <p className="empty-state-text">
                    Enter keywords to discover LinkedIn and Twitter/X profiles. Results are powered by Google Custom Search API.
                  </p>
                <div className="empty-state-info">
                  <p className="info-text">
                    <strong>Note:</strong> This tool only displays search results metadata. 
                    Click &quot;Open Profile&quot; to view profiles on their original sites.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

