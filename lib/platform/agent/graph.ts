import { END, START, StateGraph } from '@langchain/langgraph'
import { RontzenAgentState } from '@/lib/platform/agent/state'
import { retrieveContextNode } from '@/lib/platform/agent/nodes/retrieveContext'
import { draftReplyNode } from '@/lib/platform/agent/nodes/draftReply'

/**
 * retrieve → draft. Extend with re-query or tool nodes on new edges from draft.
 */
export function buildRontzenAgentGraph() {
  return new StateGraph(RontzenAgentState)
    .addNode('retrieve', retrieveContextNode)
    .addNode('draft', draftReplyNode)
    .addEdge(START, 'retrieve')
    .addEdge('retrieve', 'draft')
    .addEdge('draft', END)
    .compile()
}

let compiled: ReturnType<typeof buildRontzenAgentGraph> | null = null

export function getRontzenAgentGraph() {
  if (!compiled) {
    compiled = buildRontzenAgentGraph()
  }
  return compiled
}
