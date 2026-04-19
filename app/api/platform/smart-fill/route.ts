import { NextResponse } from 'next/server'
import {
  extractJsonObject,
  mergeSmartFillWithDeckInference,
  normalizeSmartFillPayload,
  type SmartFillData,
} from '@/lib/platform/smartFill'

const MAX_DECK_CHARS = 24_000

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

async function callLlamaChat(params: { baseUrl: string; model: string; systemPrompt: string; prompt: string }) {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { deckText?: string; deckFileName?: string }
    const deckText = (body.deckText || '').trim()
    if (!deckText) {
      return NextResponse.json({ error: 'Pitch deck text is required. Upload a PDF and wait for extraction.' }, { status: 400 })
    }

    const clipped = deckText.slice(0, MAX_DECK_CHARS)
    const preferredModel = process.env.LLAMA_MODEL || 'llama3.2'
    const baseUrl = process.env.LLAMA_BASE_URL || 'http://localhost:11434'

    const systemPrompt = [
      'You extract structured startup data from pitch deck text for a founder workspace.',
      'Rules:',
      '- Only use facts stated or clearly implied in the deck. If unknown, use null for that field or omit teamMembers entries.',
      '- Never invent traction metrics, logos, or confidential numbers.',
      '- tamUsd, samUsd, somUsd: total/serviceable/obtainable market in USD as plain numbers (e.g. 12000000000 for $12B TAM). Convert phrases like "$50B TAM" / "SAM of 1.2B" into numeric USD; use null only when the deck gives no usable figure.',
      '- Text fields use Markdown (headings, bullets allowed).',
      '- teamMembers: max 6 entries from team / about slides; each needs name, role, bio (1–3 sentences). linkedinUrl: full URL or null. experience: 1–4 short bullet strings per person, deck-grounded or placeholder if thin.',
      '- suggestedPageTitle: short workspace title (e.g. "Acme — Brief") or null.',
      'Return ONLY one valid JSON object. No markdown fences, no commentary before or after the JSON.',
      '',
      'Required shape (null allowed for optional scalars/strings; teamMembers may be []):',
      '{',
      '  "suggestedPageTitle": string | null,',
      '  "companyDescriptionMd": string | null,',
      '  "problemMd": string | null,',
      '  "solutionMd": string | null,',
      '  "tamUsd": number | null,',
      '  "samUsd": number | null,',
      '  "somUsd": number | null,',
      '  "competitiveLandscapeMd": string | null,',
      '  "teamMembers": [ { "name": string, "role": string, "bio": string, "linkedinUrl": string | null, "experience": string[] } ]',
      '}',
    ].join('\n')

    const prompt = [
      `Deck filename (hint only): ${body.deckFileName || 'unknown'}`,
      '',
      'DECK TEXT:',
      clipped,
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
      const availableModels = await listAvailableModels(baseUrl)
      return NextResponse.json(
        {
          error: `LLaMA error (${llamaResponse.status}). ${details || ''}${availableModels.length ? ` Models: ${availableModels.join(', ')}` : ''}`,
        },
        { status: 502 }
      )
    }

    const payload = (await llamaResponse.json()) as unknown
    const answer = extractAssistantText(payload)
    if (!answer) {
      return NextResponse.json({ error: 'LLaMA returned an empty response.' }, { status: 502 })
    }

    const json = extractJsonObject(answer)
    if (!json) {
      return NextResponse.json(
        { error: 'Could not parse JSON from the model. Try again or use a model that follows JSON-only instructions.' },
        { status: 422 }
      )
    }

    const data: SmartFillData = mergeSmartFillWithDeckInference(normalizeSmartFillPayload(json), clipped)

    const hasAny =
      data.companyDescriptionMd ||
      data.problemMd ||
      data.solutionMd ||
      data.competitiveLandscapeMd ||
      data.suggestedPageTitle ||
      data.tamUsd != null ||
      data.samUsd != null ||
      data.somUsd != null ||
      data.teamMembers.length > 0

    if (!hasAny) {
      return NextResponse.json(
        { error: 'The model returned empty fields. Try again with a text-based PDF or a different model.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ data, model: usedModel })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error during smart fill.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
