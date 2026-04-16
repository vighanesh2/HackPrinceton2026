import { NextResponse } from 'next/server'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequestBody = {
  message?: string
  history?: ChatMessage[]
  context?: string
  documents?: Array<{ name?: string }>
}

type OllamaTagResponse = {
  models?: Array<{ name?: string; model?: string }>
}

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''

  const maybePayload = payload as {
    response?: string
    message?: { content?: string }
  }

  return (maybePayload.message?.content || maybePayload.response || '').trim()
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

async function callLlamaChat(params: {
  baseUrl: string
  model: string
  systemPrompt: string
  prompt: string
}) {
  const { baseUrl, model, systemPrompt, prompt } = params
  return fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const userMessage = body.message?.trim()

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const preferredModel = process.env.LLAMA_MODEL || 'llama3.2'
    const baseUrl = process.env.LLAMA_BASE_URL || 'http://localhost:11434'

    const safeHistory = (body.history || []).slice(-10)
    const conversation = safeHistory
      .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
      .join('\n')
    const context = body.context || 'No business documents provided.'
    const documentNames = (body.documents || [])
      .map((document) => document.name)
      .filter(Boolean)
      .join(', ')

    const systemPrompt = [
      'You are an AI analyst for startup and SME business documents.',
      'Answer with high signal, avoid fluff, and reference the provided context.',
      'If context is missing for a claim, explicitly say what is missing.',
      documentNames ? `Active documents: ${documentNames}` : 'Active documents: none',
    ].join('\n')

    const prompt = [
      'BUSINESS CONTEXT:',
      context,
      '',
      'RECENT CONVERSATION:',
      conversation || 'No history yet.',
      '',
      `USER QUESTION: ${userMessage}`,
      '',
      'Return concise, practical guidance and include assumptions.',
    ].join('\n')

    let usedModel = preferredModel
    let llamaResponse = await callLlamaChat({
      baseUrl,
      model: usedModel,
      systemPrompt,
      prompt,
    })

    // If the configured/default model is missing, auto-fallback to an installed model.
    if (llamaResponse.status === 404) {
      const availableModels = await listAvailableModels(baseUrl)
      const fallbackModel = availableModels[0]

      if (fallbackModel) {
        usedModel = fallbackModel
        llamaResponse = await callLlamaChat({
          baseUrl,
          model: usedModel,
          systemPrompt,
          prompt,
        })
      }
    }

    if (!llamaResponse.ok) {
      const details = await llamaResponse.text()
      const availableModels = await listAvailableModels(baseUrl)
      return NextResponse.json(
        {
          error: `LLaMA endpoint error (${llamaResponse.status}). ${details || 'No details provided.'}${availableModels.length ? ` Installed models: ${availableModels.join(', ')}` : ''}`,
        },
        { status: 502 }
      )
    }

    const payload = (await llamaResponse.json()) as unknown
    const answer = extractAssistantText(payload)

    if (!answer) {
      return NextResponse.json(
        { error: 'LLaMA returned an empty response.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      answer,
      model: usedModel,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while processing chat request.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
