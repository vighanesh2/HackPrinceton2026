import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mergeCompanyProfile } from '@/lib/platform/contextProfile'
import type { CompanyContextProfileJson } from '@/lib/platform/types'
import {
  getOllamaBaseUrl,
  getOllamaFastModel,
  ollamaChat,
  resolveChatModel,
} from '@/lib/platform/ollama'

type Body = {
  text?: string
}

/** JSON Schema subset for Ollama `format` (partial profile update from one paragraph). */
const CONTEXT_DELTA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    companyName: { type: ['string', 'null'] },
    oneLiner: { type: ['string', 'null'] },
    industry: { type: ['string', 'null'] },
    stage: {
      anyOf: [
        { type: 'null' },
        {
          type: 'string',
          enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'growth'],
        },
      ],
    },
    icp: { type: ['string', 'null'] },
    businessModel: {
      anyOf: [
        { type: 'null' },
        {
          type: 'string',
          enum: ['subscription', 'usage', 'transaction', 'services', 'hybrid'],
        },
      ],
    },
    metrics: {
      type: 'object',
      additionalProperties: true,
      properties: {
        arrUsd: { type: ['number', 'null'] },
        mrrUsd: { type: ['number', 'null'] },
        monthlyBurnUsd: { type: ['number', 'null'] },
        runwayMonths: { type: ['number', 'null'] },
        teamSize: { type: ['number', 'null'] },
        customers: { type: ['number', 'null'] },
      },
    },
    storyFields: {
      type: 'object',
      additionalProperties: true,
      properties: {
        motion: { type: ['string', 'null'] },
        riskPosture: { type: ['string', 'null'] },
        productScope: { type: ['string', 'null'] },
        timelineCommitments: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
} as const

function parseDelta(content: string): CompanyContextProfileJson {
  const trimmed = content.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) return {}
  const json = trimmed.slice(start, end + 1)
  try {
    return JSON.parse(json) as CompanyContextProfileJson
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    const text = body.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'text is required.' }, { status: 400 })
    }

    const preferred = getOllamaFastModel()
    const baseUrl = getOllamaBaseUrl()
    const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'llama3.2'], baseUrl)

    const system = [
      'You extract a PARTIAL company profile from the user paragraph for a B2B document workspace.',
      'Return ONLY one JSON object matching the schema. Use null for unknown fields.',
      'Do not invent revenue or headcount; only include numbers clearly stated or strongly implied.',
      'stage must be one of: pre-seed, seed, series-a, series-b, growth, or null.',
      'businessModel must be one of: subscription, usage, transaction, services, hybrid, or null.',
    ].join('\n')

    const userPrompt = `USER PARAGRAPH:\n${text.slice(0, 12_000)}`

    let delta: CompanyContextProfileJson = {}

    try {
      const { content } = await ollamaChat({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        format: CONTEXT_DELTA_SCHEMA as unknown as Record<string, unknown>,
        temperature: 0,
      })
      delta = parseDelta(content)
    } catch {
      const { content } = await ollamaChat({
        model,
        messages: [
          { role: 'system', content: system + '\nOutput valid JSON only, no markdown.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0,
      })
      delta = parseDelta(content)
    }

    const { data: row } = await supabase
      .from('company_context')
      .select('profile')
      .eq('user_id', user.id)
      .maybeSingle()

    const existing =
      row?.profile && typeof row.profile === 'object' && !Array.isArray(row.profile)
        ? (row.profile as Record<string, unknown>)
        : {}

    const profile = mergeCompanyProfile(existing, delta, text)

    const { error: upsertError } = await supabase.from('company_context').upsert(
      {
        user_id: user.id,
        profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      return NextResponse.json(
        {
          error: upsertError.message,
          hint:
            'If the table is missing, apply supabase/migrations/20260420120000_rontzen_workspace.sql to your project.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile, model })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'context-capture failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
