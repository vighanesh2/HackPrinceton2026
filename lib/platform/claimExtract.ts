import {
  getOllamaBaseUrl,
  getOllamaFastModel,
  ollamaChat,
  resolveChatModel,
  stripThinkingBlocks,
} from '@/lib/platform/ollama'

export const METRIC_CLAIM_KEYS = [
  'arr_usd',
  'mrr_usd',
  'monthly_burn_usd',
  'runway_months',
  'team_size',
  'customers',
] as const

export type MetricClaimKey = (typeof METRIC_CLAIM_KEYS)[number]

const CLAIMS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          claim_key: { type: 'string' },
          value: { type: ['number', 'string', 'null'] },
          unit: { type: ['string', 'null'] },
          confidence: { type: 'number' },
        },
        required: ['claim_key', 'value'],
      },
    },
  },
  required: ['claims'],
} as const

export type ExtractedClaimRow = {
  claim_key: string
  claim_value: Record<string, unknown>
  confidence: number
}

function parseClaimsJson(raw: string): ExtractedClaimRow[] {
  const trimmed = raw.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) return []
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
      claims?: Array<{ claim_key?: string; value?: unknown; unit?: string | null; confidence?: number }>
    }
    const out: ExtractedClaimRow[] = []
    for (const c of parsed.claims || []) {
      const key = typeof c.claim_key === 'string' ? c.claim_key.trim() : ''
      if (!key) continue
      const conf = typeof c.confidence === 'number' && Number.isFinite(c.confidence) ? c.confidence : 0.75
      out.push({
        claim_key: key,
        claim_value: {
          value: c.value ?? null,
          unit: c.unit ?? undefined,
        },
        confidence: Math.min(1, Math.max(0, conf)),
      })
    }
    return out
  } catch {
    return []
  }
}

/**
 * Extract structured metric claims from document plain text using the fast SLM.
 */
export async function extractClaimsWithSlm(documentPlainText: string): Promise<ExtractedClaimRow[]> {
  const text = documentPlainText.trim().slice(0, 14_000)
  if (!text) return []

  const preferred = getOllamaFastModel()
  const baseUrl = getOllamaBaseUrl()
  const model = await resolveChatModel(preferred, ['qwen3:4b', 'qwen3:8b', 'llama3.2'], baseUrl)

  const system = [
    'Extract explicit business metrics from the document as JSON.',
    'Only include numbers clearly stated. Do not guess.',
    'claim_key must be one of: arr_usd, mrr_usd, monthly_burn_usd, runway_months, team_size, customers — or a short snake_case label if none match (e.g. pipeline_usd).',
    'value: numeric when possible (USD amounts as plain numbers, months as numbers, headcount as integer).',
    'If a metric is mentioned but not numeric, use string or null.',
  ].join('\n')

  let content = ''
  try {
    const r = await ollamaChat({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `DOCUMENT:\n${text}` },
      ],
      format: CLAIMS_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0,
    })
    content = r.content
  } catch {
    const r = await ollamaChat({
      model,
      messages: [
        { role: 'system', content: system + '\nReturn valid JSON only.' },
        { role: 'user', content: `DOCUMENT:\n${text}` },
      ],
      temperature: 0,
    })
    content = r.content
  }

  return parseClaimsJson(stripThinkingBlocks(content))
}
