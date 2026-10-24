'use server'

import { redirect } from 'next/navigation'
import { normalizeAdminUsername } from '@/lib/auth/adminCredentials'
import { safeNextPath } from '@/lib/auth/nextPath'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export type AdminSignInState = { error: string } | null

const WRONG_CREDENTIALS = 'Sai tên đăng nhập hoặc mật khẩu'
const ADMIN_HOME = '/admin'

async function findLoginEmail(username: string): Promise<string | null> {
  const service = createSupabaseServiceClient()
  const { data: login } = await service.from('admin_logins').select('member_id').eq('username', username).maybeSingle()
  if (!login) return null
  const { data } = await service.auth.admin.getUserById(login.member_id)
  return data.user?.email ?? null
}

function adminTarget(next: FormDataEntryValue | null): string {
  const path = safeNextPath(typeof next === 'string' ? next : null)
  return path && (path === ADMIN_HOME || path.startsWith(`${ADMIN_HOME}/`)) ? path : ADMIN_HOME
}

export async function signInAdmin(_previous: AdminSignInState, formData: FormData): Promise<AdminSignInState> {
  const username = normalizeAdminUsername(String(formData.get('username') ?? ''))
  const password = String(formData.get('password') ?? '')
  if (!username || !password) return { error: WRONG_CREDENTIALS }

  const email = await findLoginEmail(username)
  if (!email) return { error: WRONG_CREDENTIALS }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: WRONG_CREDENTIALS }

  const { data: member } = await supabase.from('members').select('role, status').eq('id', data.user.id).maybeSingle()
  if (member?.role !== 'bcn' || member.status !== 'active') {
    await supabase.auth.signOut()
    return { error: WRONG_CREDENTIALS }
  }
  redirect(adminTarget(formData.get('next')))
}
