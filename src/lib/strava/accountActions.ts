'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { disconnectFromStrava } from '@/lib/strava/disconnect'
import { removeStravaData } from '@/lib/strava/localData'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function disconnectStrava(): Promise<void> {
  const member = await requireActiveMember()
  await disconnectFromStrava(member.id)

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteMyStravaData(): Promise<void> {
  const member = await requireActiveMember()
  await removeStravaData(createSupabaseServiceClient(), member.id)
  revalidatePath('/me')
}

export async function saveShareStats(formData: FormData): Promise<void> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('members')
    .update({ share_stats_with_club: formData.get('share_stats_with_club') === 'on' })
    .eq('id', member.id)
  revalidatePath('/me/settings')
}
