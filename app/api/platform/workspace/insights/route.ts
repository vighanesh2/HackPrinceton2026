import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildWorkspaceDocInsights } from '@/lib/platform/workspaceDocInsights'

/** GET — per-document claim / chunk / issue counts for sidebar + editor insight UI. */
export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const payload = await buildWorkspaceDocInsights(supabase, user.id)
    return NextResponse.json(payload)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'insights failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
