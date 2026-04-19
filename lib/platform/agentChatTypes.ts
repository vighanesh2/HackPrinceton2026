export type AgentConversationRow = {
  id: string
  doc_id: string | null
  title: string
  updated_at: string
  created_at: string
}

export type AgentMessageRow = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}
