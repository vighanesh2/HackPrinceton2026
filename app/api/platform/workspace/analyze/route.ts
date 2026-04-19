import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runWorkspaceAnalyzeForDoc } from '@/lib/platform/workspaceAnalyze'

type Body = { docId?: string }

/**
 * Claim extract for one doc + workspace-wide metric consistency scan (analyzer pipeline).
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

    const result = await runWorkspaceAnalyzeForDoc(supabase, user.id, docId)
    return NextResponse.json({ ok: true, docId, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'workspace analyze failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
