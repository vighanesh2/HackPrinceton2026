import { NextRequest, NextResponse } from 'next/server'
import { Dedalus, DedalusRunner } from 'dedalus-labs'

// Rate limiting: simple in-memory store
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // requests per window (lower for AI agent)
const RATE_LIMIT_WINDOW = 60000 // 1 minute

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

    const { keywords, location, site } = await request.json()

    if (!keywords || typeof keywords !== 'string' || keywords.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      )
    }

    // Get API key
    const dedalusApiKey = process.env.DEDALUS_API_KEY
    if (!dedalusApiKey) {
      return NextResponse.json(
        { error: 'Web Search Agent not configured. Please add DEDALUS_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    // Build search query
    let searchQuery = keywords.trim()
    if (location) {
      searchQuery = `${searchQuery} "${location}"`
    }

    // Determine search focus based on site selection
    let searchFocus = ''
    if (site === 'linkedin.com') {
      searchFocus = 'Focus on finding LinkedIn profiles and professional information.'
    } else if (site === 'twitter.com' || site === 'x.com') {
      searchFocus = 'Focus on finding Twitter/X profiles and social media presence.'
    } else {
      searchFocus = 'Search across LinkedIn and Twitter/X profiles.'
    }

    // Initialize Dedalus client
    const client = new Dedalus({
      apiKey: dedalusApiKey,
    })

    const runner = new DedalusRunner(client)

    // Create the agent prompt
    const agentPrompt = `You are a Web Search Agent that finds and analyzes people from the open web.

SEARCH TASK:
Find people related to: "${searchQuery}"
${location ? `Location: ${location}` : ''}
${searchFocus}

WHAT TO SEARCH FOR:
1. Personal websites and blogs
2. GitHub profiles
3. Conference speaker pages
4. Substack authors
5. AngelList / Crunchbase mentions
6. Public Twitter/X bios (indexed pages)
7. Professional profiles on various platforms

FOR EACH PERSON FOUND, PROVIDE:
1. Name
2. Role/Title
3. Why they're relevant to the search query
4. Where they appear online (sources)
5. What they talk about/write about
6. Public contact information found:
   - Emails on personal sites (label as "Found on public website")
   - Calendly links (label as "Found on blog footer" or source)
   - Contact forms URLs
   - Twitter/X handles
   - GitHub profiles
   - Newsletter signup pages
   - Any other public contact paths

IMPORTANT:
- Only use information from PUBLIC sources
- Label all contact information with its source (e.g., "Found on public website", "Found on blog footer")
- Provide AI reasoning explaining why each person is relevant
- Focus on people, not just profiles
- Return results in a structured format

Return a JSON array of people found, each with:
{
  "name": "Person Name",
  "role": "Their role/title",
  "relevance": "Why this person is relevant",
  "sources": ["source1", "source2"],
  "topics": ["topic1", "topic2"],
  "contact_info": {
    "emails": [{"email": "email@example.com", "source": "Found on public website"}],
    "calendly": [{"url": "https://calendly.com/...", "source": "Found on blog footer"}],
    "twitter": "handle",
    "github": "username",
    "website": "url",
    "other": []
  },
  "reasoning": "AI explanation of why this person is relevant"
}`

    // Run the agent with Exa and Brave Search MCPs
    const result = await runner.run({
      input: agentPrompt,
      model: 'openai/gpt-4o', // Using gpt-4o as it's more commonly available
      mcpServers: [
        'joerup/exa-mcp',              // Semantic search engine
        'simon-liang/brave-search-mcp' // Privacy-focused web search
      ],
    })

    // Parse the result
    let parsedResults = []
    // Handle both RunResult and AsyncIterableIterator types
    const resultData = result as any
    try {
      // Try to parse as JSON if the output is JSON
      const output = resultData.finalOutput || resultData.output || resultData.text || ''
      const jsonMatch = output.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0])
      } else {
        // If not JSON, try to extract structured information
        // For now, return the raw output with a note
        parsedResults = [{
          name: 'AI Agent Results',
          role: 'Search Results',
          relevance: 'Web search completed',
          sources: [],
          topics: [],
          contact_info: {},
          reasoning: output,
          raw_output: true,
        }]
      }
    } catch (parseError) {
      // If parsing fails, return the raw output
      parsedResults = [{
        name: 'AI Agent Results',
        role: 'Search Results',
        relevance: 'Web search completed',
        sources: [],
        topics: [],
        contact_info: {},
        reasoning: resultData.finalOutput || resultData.output || resultData.text || 'Search completed',
        raw_output: true,
      }]
    }

    return NextResponse.json({
      results: parsedResults,
      query: searchQuery,
      count: parsedResults.length,
      agent_used: true,
    })
  } catch (error: any) {
    console.error('Web Search Agent error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during web search' },
      { status: 500 }
    )
  }
}

