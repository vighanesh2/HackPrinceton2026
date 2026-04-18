import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSupabasePublicEnv } from '@/lib/supabase/config'

export async function GET(request: Request) {
  const { url: supabaseUrl, anonKey } = getSupabasePublicEnv()
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/platform'

  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=config`)
  }

  const safeNext =
    next.startsWith('/') && !next.startsWith('//') ? next : '/platform'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      if (isLocal) {
        return NextResponse.redirect(`${origin}${safeNext}`)
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${safeNext}`)
      }
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
