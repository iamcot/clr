import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  const target = new URL(request.url).searchParams.get('to') === 'admin' ? '/admin/login' : '/login'
  return NextResponse.redirect(`${getAppUrl()}${target}`, 303)
}
