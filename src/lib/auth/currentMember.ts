import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type CurrentMember = Database['public']['Tables']['members']['Row']

export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase.from('members').select('*').eq('id', userData.user.id).maybeSingle()
  return data
})

export async function requireActiveMember(): Promise<CurrentMember> {
  const member = await getCurrentMember()
  if (!member) redirect('/login')
  if (member.status !== 'active') redirect('/pending')
  return member
}
