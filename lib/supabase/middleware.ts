import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from '@/lib/supabase/config'

function redirectToLogin(request: NextRequest, nextPath: string, error?: string) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/login'
  redirectUrl.search = ''
  redirectUrl.searchParams.set('next', nextPath)
  if (error) redirectUrl.searchParams.set('error', error)
  return NextResponse.redirect(redirectUrl)
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname
  const nextWithSearch = `${path}${request.nextUrl.search}`

  const { url, anonKey } = getSupabasePublicEnv()
  if (!url || !anonKey) {
    if (path.startsWith('/platform')) {
      return redirectToLogin(request, nextWithSearch, 'config')
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && path.startsWith('/platform')) {
    return redirectToLogin(request, nextWithSearch)
  }

  if (user && path === '/login') {
    const nextParam = request.nextUrl.searchParams.get('next')
    const safeNext =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/platform'
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = safeNext
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
