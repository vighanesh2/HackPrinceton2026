import { NextRequest, NextResponse } from 'next/server'

// Rate limiting: simple in-memory store (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per window
const RATE_LIMIT_WINDOW = 60000 // 1 minute in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(ip)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userRequests.count >= RATE_LIMIT) {
    return false
  }

  userRequests.count++
  return true
}

interface SearchParams {
  keywords: string
  site?: string
  location?: string
  start?: number
}

function buildSearchQuery(params: SearchParams): string {
  let query = params.keywords.trim()

  // Build site filter based on selection
  if (params.site === 'all') {
    // Search both LinkedIn and Twitter/X
    query = `(site:linkedin.com/in OR site:twitter.com OR site:x.com) ${query}`
  } else if (params.site === 'linkedin.com') {
    // For LinkedIn, specifically target profile pages (/in/)
    query = `site:linkedin.com/in ${query}`
  } else if (params.site === 'twitter.com' || params.site === 'x.com') {
    // For Twitter/X, target profile pages
    query = `(site:twitter.com OR site:x.com) ${query}`
  }

  // Add location keywords if provided
  if (params.location) {
    query = `${query} "${params.location}"`
  }

  return query
}

interface GoogleSearchItem {
  title: string
  snippet: string
  link: string
  displayLink: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
  error?: {
    code: number
    message: string
  }
}

interface NormalizedResult {
  name: string
  snippet: string
  profile_url: string
  source: string
  title?: string
  location?: string
  initials?: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { keywords, site, location, start }: SearchParams = body

    // Input validation
    if (!keywords || typeof keywords !== 'string' || keywords.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      )
    }

    if (keywords.length > 200) {
      return NextResponse.json(
        { error: 'Keywords must be 200 characters or less' },
        { status: 400 }
      )
    }

    // Validate site filter - only LinkedIn, Twitter/X, or 'all' allowed
    const allowedSites = ['all', 'linkedin.com', 'twitter.com', 'x.com']
    if (!site || !allowedSites.includes(site)) {
      return NextResponse.json(
        { error: 'Invalid platform selection' },
        { status: 400 }
      )
    }

    // Get API credentials
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

    if (!apiKey || !searchEngineId) {
      console.error('Google Custom Search API credentials not configured')
      return NextResponse.json(
        { error: 'Search service not configured. Please add GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID to your .env.local file.' },
        { status: 500 }
      )
    }

    // Validate credentials format
    if (apiKey.length < 20 || searchEngineId.length < 10) {
      console.error('Invalid API credentials format')
      return NextResponse.json(
        { error: 'Invalid API credentials format. Please check your .env.local file.' },
        { status: 500 }
      )
    }

    // Build search query
    const searchQuery = buildSearchQuery({ keywords, site, location })

    // Call Google Custom Search API
    // IMPORTANT: This uses the official Google Custom Search JSON API
    // We only retrieve metadata (title, snippet, URL) - NO content scraping
    const googleApiUrl = new URL('https://www.googleapis.com/customsearch/v1')
    googleApiUrl.searchParams.set('key', apiKey)
    googleApiUrl.searchParams.set('cx', searchEngineId)
    googleApiUrl.searchParams.set('q', searchQuery)
    googleApiUrl.searchParams.set('num', '10')
    
    // Add pagination (start index)
    const startIndex = start || 1
    googleApiUrl.searchParams.set('start', startIndex.toString())

    console.log('Search query:', searchQuery)
    console.log('API URL (without key):', googleApiUrl.toString().replace(apiKey, 'HIDDEN'))

    const response = await fetch(googleApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google API error:', JSON.stringify(errorData, null, 2))
      
      if (response.status === 400) {
        // Provide more specific error message
        const errorMessage = errorData.error?.message || 'Invalid request'
        const errorDetails = errorData.error?.errors?.[0]?.message || ''
        return NextResponse.json(
          { 
            error: `Invalid request: ${errorMessage}. ${errorDetails} Please check your API credentials and search engine configuration.` 
          },
          { status: 400 }
        )
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Search API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Search service error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      )
    }

    const data: GoogleSearchResponse = await response.json()

    // Handle API errors
    if (data.error) {
      return NextResponse.json(
        { error: `Search API error: ${data.error.message}` },
        { status: 400 }
      )
    }

    // Normalize results
    // We only extract metadata provided by Google - NO scraping
    // Filter out Twitter/X posts (only show profiles)
    const filteredItems = (data.items || []).filter((item) => {
      const url = item.link.toLowerCase()
      // Exclude Twitter/X posts (they contain /status/ in the URL)
      if (url.includes('twitter.com') || url.includes('x.com')) {
        // Exclude posts - they have /status/ in the URL
        if (url.includes('/status/')) {
          return false
        }
        // Exclude other non-profile pages
        if (url.includes('/i/') || url.includes('/hashtag/') || url.includes('/search')) {
          return false
        }
      }
      return true
    })

    const normalizedResults: NormalizedResult[] = filteredItems.map((item) => {
      // Extract source from displayLink (e.g., "linkedin.com" from "www.linkedin.com")
      const source = item.displayLink.replace(/^www\./, '') || 'unknown'

      // Parse LinkedIn profile information from title
      // LinkedIn titles are usually: "Name | Title | Location"
      let name = item.title || 'Untitled'
      let title = ''
      let location = ''
      
      if (source.includes('linkedin.com') && item.title) {
        const parts = item.title.split('|').map(p => p.trim())
        if (parts.length >= 1) name = parts[0]
        if (parts.length >= 2) title = parts[1]
        if (parts.length >= 3) location = parts[2]
      }

      // Parse Twitter/X profile information
      // Twitter/X titles are usually: "Name (@username) / X" or "Name (@username)"
      if ((source.includes('twitter.com') || source.includes('x.com')) && item.title) {
        // Extract name from title (remove @username and / X parts)
        name = item.title
          .replace(/\s*\(@[\w]+\)\s*/g, '') // Remove (@username)
          .replace(/\s*\/\s*X\s*$/, '') // Remove "/ X" at the end
          .trim() || item.title
      }

      // Extract initials for avatar
      const getInitials = (nameStr: string): string => {
        const words = nameStr.split(' ').filter(w => w.length > 0)
        if (words.length >= 2) {
          return (words[0][0] + words[words.length - 1][0]).toUpperCase()
        }
        return nameStr.substring(0, 2).toUpperCase()
      }

      return {
        name: name,
        snippet: item.snippet || 'No description available',
        profile_url: item.link,
        source: source,
        // Additional fields for people display
        title: title,
        location: location,
        initials: getInitials(name),
      }
    })

    // Get total results count from Google API response
    const totalResults = parseInt(data.searchInformation?.totalResults || '0')
    const currentStart = start || 1
    const nextStartIndex = normalizedResults.length === 10 ? currentStart + 10 : null
    const hasMore = nextStartIndex !== null && nextStartIndex <= totalResults

    // Return normalized results
    // Users must click links to view actual profiles - we don't fetch content
    return NextResponse.json({
      results: normalizedResults,
      query: searchQuery,
      count: normalizedResults.length,
      totalResults: totalResults,
      hasMore: hasMore,
      nextStart: nextStartIndex,
      hasMore: nextStartIndex !== null && nextStartIndex <= parseInt(totalResults),
      nextStart: nextStartIndex,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during search' },
      { status: 500 }
    )
  }
}

