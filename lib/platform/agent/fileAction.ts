/**
 * Structured file mutations proposed by the workspace agent (Cursor-style keep/undo).
 */
export type AgentFileAction =
  | { type: 'none' }
  | {
      type: 'replace_body'
      docId: string
      proposedTitle?: string
      proposedBodyHtml: string
      baselineTitle: string
      baselineBodyHtml: string
      summary: string
    }
  | {
      type: 'create_document'
      proposedTitle: string
      proposedBodyHtml: string
      summary: string
    }

export function isAgentFileAction(x: unknown): x is AgentFileAction {
  if (!x || typeof x !== 'object') return false
  const t = (x as { type?: unknown }).type
  return t === 'none' || t === 'replace_body' || t === 'create_document'
}
