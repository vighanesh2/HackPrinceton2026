import type { SupabaseClient } from '@supabase/supabase-js'

/** Vector ANN hit from `match_document_chunks` RPC. */
export type RetrievedChunk = {
  id: string
  docId: string
  chunkIndex: number
  text: string
  metadata: Record<string, unknown>
  /** Cosine distance (pgvector `<=>`); lower is closer. */
  distance: number
}

type MatchRow = {
  id: string
  doc_id: string
  chunk_index: number
  chunk_text: string
  metadata: Record<string, unknown> | null
  distance: number
}

/**
 * pgvector similarity search scoped to the current user (RLS + explicit p_user_id).
 */
export async function matchDocumentChunks(
  supabase: SupabaseClient,
  params: {
    queryEmbedding: number[]
    userId: string
    matchCount?: number
    docIds?: string[] | null
  }
): Promise<RetrievedChunk[]> {
  if (params.queryEmbedding.length !== 768) {
    throw new Error(
      `Expected 768-dim embedding (nomic-embed-text), got ${params.queryEmbedding.length}`
    )
  }

  const { data, error } = await supabase.rpc('match_document_chunks', {
    p_query_embedding: params.queryEmbedding,
    p_match_count: params.matchCount ?? 10,
    p_user_id: params.userId,
    p_doc_ids: params.docIds?.length ? params.docIds : null,
  })

  if (error) {
    throw new Error(`match_document_chunks: ${error.message}`)
  }

  const rows = (data || []) as MatchRow[]
  return rows.map((r) => ({
    id: r.id,
    docId: r.doc_id,
    chunkIndex: r.chunk_index,
    text: r.chunk_text,
    metadata: r.metadata ?? {},
    distance: r.distance,
  }))
}

/**
 * Hybrid retrieval (PLAN): dense vector + keyword FTS on `document_chunks.fts`.
 * v1: runs vector search then optional text filter client-side; full DB-side hybrid can merge ranks later.
 */
export async function hybridRetrieveChunks(
  supabase: SupabaseClient,
  params: {
    queryEmbedding: number[]
    queryText: string
    userId: string
    matchCount?: number
    docIds?: string[] | null
  }
): Promise<RetrievedChunk[]> {
  const k = params.matchCount ?? 10
  const vectorHits = await matchDocumentChunks(supabase, {
    queryEmbedding: params.queryEmbedding,
    userId: params.userId,
    matchCount: Math.min(k * 3, 30),
    docIds: params.docIds,
  })

  const q = params.queryText.trim().toLowerCase()
  if (!q) return vectorHits.slice(0, k)

  const terms = q.split(/\s+/).filter((t) => t.length > 2)
  const boosted = vectorHits.filter((h) => {
    const body = h.text.toLowerCase()
    return terms.some((t) => body.includes(t))
  })

  const merged = [...boosted, ...vectorHits.filter((h) => !boosted.includes(h))]
  return merged.slice(0, k)
}
