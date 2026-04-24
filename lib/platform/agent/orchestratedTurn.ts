import type { SupabaseClient } from '@supabase/supabase-js'
import { buildAgentContextBlockWithMeta } from '@/lib/platform/buildAgentContext'
import {
  ollamaDraftNewFinancialDocument,
  ollamaEditDocumentPlain,
  plainOrMarkdownToEditorHtml,
} from '@/lib/platform/documentModelEdit'
import { htmlToPlainText } from '@/lib/platform/htmlPlainText'
import type { AgentRagPayload } from '@/lib/platform/agent'
import { getRontzenAgentGraph } from '@/lib/platform/agent/graph'
import type { AgentFileAction } from '@/lib/platform/agent/fileAction'

const EMPTY_WORKSPACE_ADDENDUM = [
  'Workspace may be empty (no saved cloud documents).',
  'If the user sounds unsure what to do next, ask in one short sentence what financial document they want in the workspace (e.g. pitch deck outline, board memo, model assumptions, cap table shell).',
  'If they only want definitions or general advice, answer normally without pushing file creation.',
].join(' ')

function classifyIntent(params: {
  userMessage: string
  workspaceDocCount: number
  hasFocusedDoc: boolean
}): 'chat' | 'edit_focused' | 'create_new' {
  const msg = params.userMessage.trim()
  const lower = msg.toLowerCase()

  if (/\b(new doc|new document)\b/i.test(msg)) {
    return 'create_new'
  }
  if (
    /\b(create|draft|start)\b/i.test(lower) &&
    /\b(deck|memo|model|document|doc|one[\s-]?pager|cap\s*table|financial|board|pitch)\b/i.test(lower)
  ) {
    return 'create_new'
  }

  if (params.workspaceDocCount === 0) {
    const definitionQ =
      /^(what|who|when|where|why|how)\s+(is|are|does|do|should|can)\b/i.test(msg) &&
      !/\b(write|draft|create|make|build|generate|outline)\b/i.test(lower)
    const wantsDeliverable = /\b(create|draft|write|make|build|generate|outline|start a)\b/i.test(lower)
    const namesDoc =
      /\b(deck|memo|model|cap table|financial|forecast|one[\s-]?pager|board|10-?k|pitch|term sheet|data room)\b/i.test(
        lower
      )
    if (definitionQ && !wantsDeliverable) return 'chat'
    if (msg.length < 12 && !namesDoc && !wantsDeliverable) return 'chat'
    if (namesDoc || wantsDeliverable || msg.length >= 36) return 'create_new'
    return 'chat'
  }

  if (!params.hasFocusedDoc) {
    if (/\bcreate\b|\bnew document\b|\banother doc\b/i.test(msg)) return 'create_new'
    return 'chat'
  }

  if (
    /\b(fix|rewrite|revise|reword|edit|update|fill in|fill out|add (a |the )?section|replace|change|insert|correct|polish|shorten|expand)\b/i.test(
      lower
    )
  ) {
    return 'edit_focused'
  }
  if (
    /\b(draft|write|put this|turn this|convert to|make this)\b/i.test(lower) &&
    /\b(in the doc|in this doc|into the document|here|below)\b/i.test(lower)
  ) {
    return 'edit_focused'
  }

  return 'chat'
}

function emptyRag(): AgentRagPayload {
  return {
    chunkCount: 0,
    queryTooShort: false,
    fallbackExcerptApplied: false,
    sources: [],
  }
}

export async function runAgentOrchestratedTurn(input: {
  userMessage: string
  docId: string | null
  workspaceDocCount: number
  focusedDoc: { id: string; title: string; body_html: string } | null
  supabase: SupabaseClient
  userId: string
}): Promise<{ assistantReply: string; rag: AgentRagPayload; fileAction: AgentFileAction }> {
  const { userMessage, docId, workspaceDocCount, focusedDoc, supabase, userId } = input
  const hasFocusedDoc = !!focusedDoc

  const intent = classifyIntent({
    userMessage,
    workspaceDocCount,
    hasFocusedDoc,
  })

  if (intent === 'create_new') {
    const ctx = await buildAgentContextBlockWithMeta(supabase, {
      userId,
      userMessage,
      docId: null,
    })
    const draft = await ollamaDraftNewFinancialDocument({
      instruction: userMessage,
      contextBlock: ctx.block,
    })
    const proposedBodyHtml = plainOrMarkdownToEditorHtml(draft.bodyMarkdown)
    const assistantReply = [
      draft.summary,
      '',
      '_When you **Keep** the draft, a new cloud document is saved. **Undo** removes it._',
    ].join('\n')

    return {
      assistantReply,
      rag: {
        chunkCount: ctx.chunkCount,
        queryTooShort: ctx.queryTooShort,
        fallbackExcerptApplied: ctx.fallbackExcerptApplied,
        sources: ctx.sources,
      },
      fileAction: {
        type: 'create_document',
        proposedTitle: draft.title || 'Untitled draft',
        proposedBodyHtml,
        summary: draft.summary,
      },
    }
  }

  if (intent === 'edit_focused' && focusedDoc) {
    const plain = htmlToPlainText(focusedDoc.body_html || '')
    const { summary, revisedPlain } = await ollamaEditDocumentPlain({
      instruction: userMessage,
      documentName: focusedDoc.title || 'Untitled',
      currentPlain: plain || '(empty document)',
    })
    const proposedBodyHtml = plainOrMarkdownToEditorHtml(revisedPlain)
    const assistantReply = [
      summary,
      '',
      '_Review the editor. **Keep** saves this version; **Undo** restores the previous file._',
    ].join('\n')

    return {
      assistantReply,
      rag: emptyRag(),
      fileAction: {
        type: 'replace_body',
        docId: focusedDoc.id,
        proposedBodyHtml,
        baselineTitle: focusedDoc.title || 'Untitled',
        baselineBodyHtml: focusedDoc.body_html || '',
        summary,
      },
    }
  }

  const graph = getRontzenAgentGraph()
  const systemAddendum = workspaceDocCount === 0 ? EMPTY_WORKSPACE_ADDENDUM : ''
  const result = await graph.invoke(
    {
      userMessage,
      docId,
      contextBlock: '',
      ragChunkCount: 0,
      queryTooShort: false,
      fallbackExcerptApplied: false,
      ragSources: [],
      assistantReply: '',
      systemAddendum,
    },
    {
      configurable: {
        supabase,
        userId,
      },
    }
  )

  return {
    assistantReply: result.assistantReply || '',
    rag: {
      chunkCount: result.ragChunkCount ?? 0,
      queryTooShort: result.queryTooShort ?? false,
      fallbackExcerptApplied: result.fallbackExcerptApplied ?? false,
      sources: result.ragSources ?? [],
    },
    fileAction: { type: 'none' },
  }
}
