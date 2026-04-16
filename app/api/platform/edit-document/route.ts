import { NextResponse } from 'next/server'

type EditRequestBody = {
  instruction?: string
  documentName?: string
  currentContent?: string
}

type OllamaTagResponse = {
  models?: Array<{ name?: string; model?: string }>
}

async function listAvailableModels(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) return []
    const payload = (await response.json()) as OllamaTagResponse
    return (payload.models || [])
      .map((item) => item.name || item.model || '')
      .filter(Boolean)
  } catch {
    return []
  }
}

async function callLlama(baseUrl: string, model: string, system: string, user: string) {
  return fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
}

function parseAssistant(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const data = payload as { response?: string; message?: { content?: string } }
  return (data.message?.content || data.response || '').trim()
}

function extractBetween(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker)
  const end = text.indexOf(endMarker)
  if (start === -1 || end === -1 || end <= start) return ''
  return text.slice(start + startMarker.length, end).trim()
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EditRequestBody
    const instruction = body.instruction?.trim()
    const currentContent = body.currentContent?.trim()

    if (!instruction || !currentContent) {
      return NextResponse.json(
        { error: 'Instruction and currentContent are required.' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.LLAMA_BASE_URL || 'http://localhost:11434'
    const preferredModel = process.env.LLAMA_MODEL || 'llama3.2'

    const systemPrompt =
      'You are a precise document editor. Keep facts unless user asks to change them. Return only the required markers.'
    const userPrompt = [
      `Document name: ${body.documentName || 'Untitled document'}`,
      `Edit instruction: ${instruction}`,
      '',
      'Current document:',
      currentContent,
      '',
      'Return EXACTLY in this format:',
      '<<<SUMMARY>>>',
      '<1-2 sentence summary of edits>',
      '<<<END_SUMMARY>>>',
      '<<<REVISED_DOCUMENT>>>',
      '<full revised document text>',
      '<<<END_REVISED_DOCUMENT>>>',
    ].join('\n')

    let usedModel = preferredModel
    let response = await callLlama(baseUrl, usedModel, systemPrompt, userPrompt)
    if (response.status === 404) {
      const available = await listAvailableModels(baseUrl)
      if (available.length) {
        usedModel = available[0]
        response = await callLlama(baseUrl, usedModel, systemPrompt, userPrompt)
      }
    }

    if (!response.ok) {
      const details = await response.text()
      return NextResponse.json(
        { error: `LLaMA edit endpoint error (${response.status}). ${details}` },
        { status: 502 }
      )
    }

    const payload = (await response.json()) as unknown
    const text = parseAssistant(payload)
    if (!text) {
      return NextResponse.json({ error: 'LLaMA returned empty edit output.' }, { status: 502 })
    }

    const revisedContent =
      extractBetween(text, '<<<REVISED_DOCUMENT>>>', '<<<END_REVISED_DOCUMENT>>>') || text
    const summary =
      extractBetween(text, '<<<SUMMARY>>>', '<<<END_SUMMARY>>>') ||
      'Draft generated. Review and accept to apply.'

    return NextResponse.json({ revisedContent, summary, model: usedModel })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while editing file.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
