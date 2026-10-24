'use server'

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'node:crypto'
import {
  normalizeAdminUsername,
  validateAdminPassword,
  validateAdminUsername,
} from '@/lib/auth/adminCredentials'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

const UNIQUE_VIOLATION_CODE = '23505'
const DISABLED_PASSWORD_BYTES = 32
const ADMIN_EMAIL_DOMAIN = 'users.clr.local'
const DISPLAY_NAME_MAX_LENGTH = 60

async function writeAudit(actorId: string, memberId: string, action: string, username: string | null) {
  await createSupabaseServiceClient()
    .from('audit_logs')
    .insert({ actor_id: actorId, action, target_table: 'members', target_id: memberId, after: { username } })
}

async function isActiveBcn(memberId: string): Promise<boolean> {
  const { data } = await createSupabaseServiceClient()
    .from('members')
    .select('role, status')
    .eq('id', memberId)
    .maybeSingle()
  return data?.role === 'bcn' && data.status === 'active'
}

export async function setAdminLogin(formData: FormData): Promise<ActionResult> {
  const actor = await requireBcn()
  const memberId = String(formData.get('member_id') ?? '')
  const username = normalizeAdminUsername(String(formData.get('username') ?? ''))
  const password = String(formData.get('password') ?? '')
  const invalid = validateAdminUsername(username) ?? validateAdminPassword(password)
  if (invalid) return actionError(invalid)
  if (!(await isActiveBcn(memberId))) return actionError('Chỉ tạo tài khoản cho thành viên BCN đang hoạt động')

  const service = createSupabaseServiceClient()
  const { error } = await service
    .from('admin_logins')
    .upsert({ member_id: memberId, username, updated_at: new Date().toISOString() })
  if (error) {
    return actionError(error.code === UNIQUE_VIOLATION_CODE ? 'Tên đăng nhập đã được dùng' : 'Không lưu được tài khoản')
  }
  const { error: passwordError } = await service.auth.admin.updateUserById(memberId, { password })
  if (passwordError) return actionError('Không đặt được mật khẩu, vui lòng thử lại')

  await writeAudit(actor.id, memberId, 'set_admin_login', username)
  revalidatePath(`/admin/members/${memberId}`)
  return actionSuccess('Đã lưu tài khoản đăng nhập admin')
}

// Không xoá được mật khẩu trong auth nên đặt thành chuỗi ngẫu nhiên không ai biết
export async function removeAdminLogin(formData: FormData): Promise<ActionResult> {
  const actor = await requireBcn()
  const memberId = String(formData.get('member_id') ?? '')
  if (memberId === actor.id) return actionError('Không tự gỡ tài khoản của chính mình')

  const service = createSupabaseServiceClient()
  const { error } = await service.from('admin_logins').delete().eq('member_id', memberId)
  if (error) return actionError('Không gỡ được tài khoản')
  await service.auth.admin.updateUserById(memberId, { password: randomBytes(DISABLED_PASSWORD_BYTES).toString('hex') })

  await writeAudit(actor.id, memberId, 'remove_admin_login', null)
  revalidatePath(`/admin/members/${memberId}`)
  return actionSuccess('Đã gỡ tài khoản đăng nhập admin')
}

// Tài khoản admin riêng: user Supabase email giả + dòng members không có Strava, vai trò BCN
export async function createAdminAccount(formData: FormData): Promise<ActionResult> {
  const actor = await requireBcn()
  const displayName = String(formData.get('display_name') ?? '').trim().slice(0, DISPLAY_NAME_MAX_LENGTH)
  const username = normalizeAdminUsername(String(formData.get('username') ?? ''))
  const password = String(formData.get('password') ?? '')
  const invalid = validateAdminUsername(username) ?? validateAdminPassword(password)
  if (!displayName) return actionError('Cần nhập tên hiển thị')
  if (invalid) return actionError(invalid)

  const service = createSupabaseServiceClient()
  const { data: taken } = await service.from('admin_logins').select('member_id').eq('username', username).maybeSingle()
  if (taken) return actionError('Tên đăng nhập đã được dùng')

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: `admin_${username}@${ADMIN_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) return actionError('Không tạo được tài khoản, vui lòng thử lại')

  const memberId = created.user.id
  const { error: memberError } = await service.from('members').insert({
    id: memberId,
    display_name: displayName,
    role: 'bcn',
    status: 'active',
    joined_at: new Date().toISOString(),
  })
  const { error: loginError } = memberError
    ? { error: memberError }
    : await service.from('admin_logins').insert({ member_id: memberId, username })
  if (memberError || loginError) {
    await service.auth.admin.deleteUser(memberId)
    return actionError('Không tạo được tài khoản, vui lòng thử lại')
  }

  await writeAudit(actor.id, memberId, 'create_admin_account', username)
  revalidatePath('/admin/members')
  return actionSuccess(`Đã tạo tài khoản admin “${username}”`)
}
