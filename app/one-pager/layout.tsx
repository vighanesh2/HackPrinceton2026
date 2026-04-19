import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'One pager',
}

export default async function OnePagerLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/login?error=config')
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/one-pager')
  }

  return <>{children}</>
}
