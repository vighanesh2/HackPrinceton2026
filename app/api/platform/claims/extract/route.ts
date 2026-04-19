import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractClaimsForUserDoc } from '@/lib/platform/workspaceAnalyze'

type Body = { docId?: string }

/** Run SLM claim extraction for one document; replaces rows in `document_claims` for that doc. */
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

    try {
      const { claimCount } = await extractClaimsForUserDoc(supabase, user.id, docId)
      return NextResponse.json({ ok: true, docId, claimCount })
    } catch (inner) {
      const msg = inner instanceof Error ? inner.message : 'extract failed'
      if (msg === 'Document not found.') {
        return NextResponse.json({ error: msg }, { status: 404 })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'claims extract failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
