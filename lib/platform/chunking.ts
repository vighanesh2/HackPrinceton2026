import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

/**
 * Split plain text / markdown for RAG. Character-based (~PLAN: 500–800 tokens → ~2–3k chars).
 */
export async function splitTextForRAG(
  documentText: string,
  options?: { chunkSize?: number; chunkOverlap?: number }
): Promise<string[]> {
  const trimmed = documentText.trim()
  if (!trimmed) return []

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options?.chunkSize ?? 2000,
    chunkOverlap: options?.chunkOverlap ?? 200,
    separators: ['\n\n## ', '\n\n### ', '\n\n', '\n', '. ', ' ', ''],
  })

  return splitter.splitText(trimmed)
}
