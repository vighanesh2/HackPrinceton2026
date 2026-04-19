import type { SupabaseClient } from '@supabase/supabase-js'
import { hybridRetrieveChunks } from '@/lib/platform/retriever'
import { htmlToPlainText } from '@/lib/platform/htmlPlainText'
import { ollamaEmbed } from '@/lib/platform/ollama'

export type RagSourceRef = {
  sourceIndex: number
  chunkId: string
  docId: string
  preview: string
}

export type AgentContextBlockMeta = {
  chunkCount: number
  queryTooShort: boolean
  /** True when no vector hits but we inlined live plain text from the active doc. */
  fallbackExcerptApplied: boolean
  /** Numbered sources the model should cite as [S1], [S2], … */
  sources: RagSourceRef[]
}

/**
 * Company profile + hybrid chunk retrieval for agent and chat RAG paths.
 * Chunks are labeled [S1]… for citation; if none match, optional live doc excerpt fills the gap.
 */
export async function buildAgentContextBlockWithMeta(
  supabase: SupabaseClient,
  params: { userId: string; userMessage: string; docId?: string | null }
): Promise<{ block: string } & AgentContextBlockMeta> {
  const parts: string[] = []
  const sources: RagSourceRef[] = []

  const { data: ctxRow } = await supabase
    .from('company_context')
    .select('profile')
    .eq('user_id', params.userId)
    .maybeSingle()

  const profile = ctxRow?.profile
  parts.push('COMPANY PROFILE (JSON):')
  parts.push(
    profile && typeof profile === 'object' ? JSON.stringify(profile, null, 2) : '{}'
  )

  if (params.docId) {
    const { data: focusDoc } = await supabase
      .from('documents')
      .select('title')
      .eq('id', params.docId)
      .eq('user_id', params.userId)
      .maybeSingle()
    const dn = focusDoc?.title?.trim()
    if (dn) {
      parts.push(
        `\nACTIVE FOCUSED DOCUMENT (user is editing this file; retrieval is scoped here): ${JSON.stringify(dn)}`
      )
    }
  }

  const q = params.userMessage.trim().slice(0, 2000)
  if (q.length < 3) {
    parts.push('\nRETRIEVED CHUNKS: (query too short for embedding search — expand your question.)')
    return {
      block: parts.join('\n'),
      chunkCount: 0,
      queryTooShort: true,
      fallbackExcerptApplied: false,
      sources: [],
    }
  }

  let fallbackExcerptApplied = false

  try {
    const queryEmbedding = await ollamaEmbed(q)
    const chunks = await hybridRetrieveChunks(supabase, {
      queryEmbedding,
      queryText: q,
      userId: params.userId,
      matchCount: 8,
      docIds: params.docId ? [params.docId] : null,
    })

    parts.push(
      '\nRETRIEVED DOC CHUNKS (hybrid vector + keyword; labels [S1], [S2]… are for your reasoning only—do not echo them in user-facing text):'
    )

    if (chunks.length === 0) {
      parts.push('(no vector chunks matched — index may be empty or still indexing after save.)')
    } else {
      chunks.forEach((c, i) => {
        const si = i + 1
        parts.push(`\n--- [S${si}] chunk_id=${c.id} doc_id=${c.docId} ---\n${c.text}`)
        sources.push({
          sourceIndex: si,
          chunkId: c.id,
          docId: c.docId,
          preview: c.text.replace(/\s+/g, ' ').trim().slice(0, 220),
        })
      })
    }

    if (chunks.length === 0 && params.docId) {
      const { data: docRow } = await supabase
        .from('documents')
        .select('title, body_html')
        .eq('id', params.docId)
        .eq('user_id', params.userId)
        .maybeSingle()

      const plain = htmlToPlainText(docRow?.body_html || '')
      if (plain.length > 80) {
        const excerpt = plain.slice(0, 2800)
        parts.push(
          '\n\nACTIVE DOCUMENT LIVE EXCERPT (plain text from editor; not from vector index — use for grounding until chunks exist):\n' +
            excerpt
        )
        fallbackExcerptApplied = true
      }
    }

    return {
      block: parts.join('\n'),
      chunkCount: chunks.length,
      queryTooShort: false,
      fallbackExcerptApplied,
      sources,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    parts.push(`\nRETRIEVAL NOTE: ${msg}`)
    return {
      block: parts.join('\n'),
      chunkCount: 0,
      queryTooShort: false,
      fallbackExcerptApplied,
      sources: [],
    }
  }
}

/**
 * Build the text block passed into the LangGraph agent (profile JSON + RAG snippets).
 */
export async function buildAgentContextBlock(
  supabase: SupabaseClient,
  params: { userId: string; userMessage: string; docId?: string | null }
): Promise<string> {
  const { block } = await buildAgentContextBlockWithMeta(supabase, params)
  return block
}
