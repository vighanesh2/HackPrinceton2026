import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { classifyNearestDocType } from '@/lib/platform/classifyDocType'
import { splitTextForRAG } from '@/lib/platform/chunking'
import { htmlToPlainText } from '@/lib/platform/htmlPlainText'
import { getOllamaEmbedModel, ollamaEmbed } from '@/lib/platform/ollama'
import { runWorkspaceAnalyzeForDoc } from '@/lib/platform/workspaceAnalyze'

type Body = {
  docId?: string
}

function chunkContentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 32)
}

async function runCrossDocAnalyzeAfterIndex(
  supabase: SupabaseClient,
  userId: string,
  docId: string
): Promise<void> {
  try {
    await runWorkspaceAnalyzeForDoc(supabase, userId, docId)
  } catch {
    /* Claims/scan are best-effort; indexing already succeeded */
  }
}

async function embedBatch(texts: string[], batchSize: number): Promise<number[][]> {
  const model = getOllamaEmbedModel()
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize)
    const vectors = await Promise.all(slice.map((t) => ollamaEmbed(t, model)))
    out.push(...vectors)
  }
  return out
}

/**
 * Chunk document body, embed with nomic-embed-text, replace rows in `document_chunks`.
 * Required for RAG (`match_document_chunks`) and hybrid retrieval.
 */
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
    const docId = body.docId?.trim()
    if (!docId) {
      return NextResponse.json({ error: 'docId is required.' }, { status: 400 })
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, user_id, doc_type, title, body_html')
      .eq('id', docId)
      .maybeSingle()

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }
    if (!doc || doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    const plain = htmlToPlainText(doc.body_html || '')

    let effectiveDocType = doc.doc_type
    let docTypeChanged = false
    try {
      const classified = await classifyNearestDocType({
        title: doc.title || '',
        plainText: plain,
      })
      if (classified.ok) {
        if (classified.docType === doc.doc_type) {
          effectiveDocType = classified.docType
        } else {
          const { error: patchErr } = await supabase
            .from('documents')
            .update({ doc_type: classified.docType, updated_at: new Date().toISOString() })
            .eq('id', docId)
            .eq('user_id', user.id)
          if (!patchErr) {
            effectiveDocType = classified.docType
            docTypeChanged = true
          }
        }
      }
    } catch {
      /* Ollama/embed down — keep existing doc_type and still index */
    }

    const pieces = await splitTextForRAG(plain)

    const { error: delError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('doc_id', docId)
      .eq('user_id', user.id)

    if (delError) {
      return NextResponse.json(
        {
          error: delError.message,
          hint:
            'If document_chunks is missing, apply supabase/migrations/20260420120000_rontzen_workspace.sql.',
        },
        { status: 500 }
      )
    }

    if (pieces.length === 0) {
      await runCrossDocAnalyzeAfterIndex(supabase, user.id, docId)
      return NextResponse.json({
        ok: true,
        docId,
        chunkCount: 0,
        embedModel: getOllamaEmbedModel(),
        doc_type: effectiveDocType,
        docTypeChanged,
        workspaceAnalyzed: true,
      })
    }

    const embeddings = await embedBatch(pieces, 8)

    const rows = pieces.map((chunk_body, chunk_index) => ({
      user_id: user.id,
      doc_id: docId,
      chunk_index,
      chunk_body,
      content_hash: chunkContentHash(chunk_body),
      metadata: {
        doc_type: effectiveDocType,
        title: doc.title,
      },
      embedding: embeddings[chunk_index],
    }))

    const { error: insError } = await supabase.from('document_chunks').insert(rows)

    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 })
    }

    await runCrossDocAnalyzeAfterIndex(supabase, user.id, docId)

    return NextResponse.json({
      ok: true,
      docId,
      chunkCount: pieces.length,
      embedModel: getOllamaEmbedModel(),
      doc_type: effectiveDocType,
      docTypeChanged,
      workspaceAnalyzed: true,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'index-document failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
