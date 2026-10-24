'use server'

import { redirect } from 'next/navigation'
import { requireActiveMember } from '@/lib/auth/currentMember'
import type { ProfileFormState } from '@/lib/members/profileFormState'
import { parseProfileInput } from '@/lib/members/profileInput'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { setFlashToast } from '@/lib/toast/setFlash'
import type { Database } from '@/lib/types/database'

type MemberUpdate = Database['public']['Tables']['members']['Update']

const ALLOWED_REDIRECTS = ['/', '/me']

function readRedirectTarget(formData: FormData): string {
  const target = formData.get('next')
  return typeof target === 'string' && ALLOWED_REDIRECTS.includes(target) ? target : '/'
}

function readRawValues(formData: FormData): ProfileFormState['values'] {
  const read = (name: string) => String(formData.get(name) ?? '')
  return {
    display_name: read('display_name'),
    gender: read('gender'),
    birth_year: read('birth_year'),
    phone: read('phone'),
  }
}

async function updateOwnMember(memberId: string, update: MemberUpdate): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('members').update(update).eq('id', memberId)
  return !error
}

export async function saveProfile(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const member = await requireActiveMember()
  const values = readRawValues(formData)

  const parsed = parseProfileInput(formData, new Date().getFullYear())
  if (!parsed.ok) return { errors: parsed.errors, values }

  const saved = await updateOwnMember(member.id, { ...parsed.value, profile_onboarded_at: new Date().toISOString() })
  if (!saved) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }

  await setFlashToast('profile_saved')
  redirect(readRedirectTarget(formData))
}

export async function skipProfile(formData: FormData): Promise<void> {
  const member = await requireActiveMember()
  await updateOwnMember(member.id, { profile_onboarded_at: new Date().toISOString() })
  redirect(readRedirectTarget(formData))
}
