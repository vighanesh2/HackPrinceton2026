import { NextResponse } from 'next/server'
import { extractJsonObject } from '@/lib/platform/smartFill'
import { isValidShadowRequest, type ShadowPatternId } from '@/lib/platform/shadowCompleteGates'

type OllamaTagResponse = {
  models?: Array<{ name?: string; model?: string }>
}

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const maybe = payload as { response?: string; message?: { content?: string } }
  return (maybe.message?.content || maybe.response || '').trim()
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
    headers: { 'Content-Type': 'application/json' },
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

function patternInstructions(pattern: ShadowPatternId): string {
  switch (pattern) {
    case 'financial':
      return [
        'Pattern: FINANCIAL.',
        'Complete only the fragment after what the user typed.',
        'Every number and currency figure in "completion" must appear verbatim in CONTEXT (same digits). If you cannot ground a number in CONTEXT, use an empty completion.',
        'Prefer one short clause (e.g. " $15,000 as of the workspace inputs, net of discounts mentioned in the deck."). Max 220 characters.',
      ].join('\n')
    case 'ownership':
      return [
        'Pattern: OWNERSHIP.',
        'Suggest a person name and role using ONLY names and titles that appear in CONTEXT (team roster, deck, or doc).',
        'If no person fits, return empty completion.',
        'Max 160 characters, one line.',
      ].join('\n')
    case 'boilerplate':
      return [
        'Pattern: BOILERPLATE.',
        'Suggest standard business phrasing (definition, KPI, or process wording) consistent with CONTEXT.',
        'Do not invent metrics. Max 220 characters.',
      ].join('\n')
    default:
      return ''
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prefix?: string
      pattern?: string
      context?: string
    }
    const prefix = (body.prefix || '').trimEnd()
    const pattern = body.pattern || ''
    const context = (body.context || '').trim() || 'No workspace context provided.'

    if (!prefix || !isValidShadowRequest(prefix, pattern)) {
      return NextResponse.json({ error: 'Invalid or unmatched pattern for this prefix.' }, { status: 400 })
    }

    const preferredModel = process.env.LLAMA_MODEL || 'llama3.2'
    const baseUrl = process.env.LLAMA_BASE_URL || 'http://localhost:11434'

    const systemPrompt = [
      'You are "Shadow Completer" for a founder workspace editor.',
      'Return ONLY one JSON object, no markdown fences, no commentary.',
      'Shape: {"completion": string, "sourceHint": string}',
      'completion: text to append after the user cursor (no leading newline). Use empty string "" if unsure.',
      'sourceHint: short label like "Deck", "Financial inputs", "Team", or "Workspace".',
      patternInstructions(pattern as ShadowPatternId),
    ].join('\n')

    const prompt = [
      'CONTEXT (may be long):',
      context.slice(0, 28_000),
      '',
      'USER_LINE_PREFIX (complete after this, do not repeat it):',
      prefix.slice(-500),
    ].join('\n')

    let usedModel = preferredModel
    let llamaResponse = await callLlamaChat({
      baseUrl,
      model: usedModel,
      systemPrompt,
      prompt,
    })

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
      return NextResponse.json(
        { error: `LLaMA error (${llamaResponse.status}). ${details || ''}` },
        { status: 502 }
      )
    }

    const payload = (await llamaResponse.json()) as unknown
    const answer = extractAssistantText(payload)
    if (!answer) {
      return NextResponse.json({ completion: '', sourceHint: '', model: usedModel })
    }

    const json = extractJsonObject(answer)
    const completion = typeof json?.completion === 'string' ? json.completion.trim() : ''
    const sourceHint = typeof json?.sourceHint === 'string' ? json.sourceHint.trim() : ''

    const safe = completion.length > 400 ? completion.slice(0, 400) : completion

    return NextResponse.json({
      completion: safe,
      sourceHint: sourceHint.slice(0, 80),
      model: usedModel,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while generating shadow completion.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
