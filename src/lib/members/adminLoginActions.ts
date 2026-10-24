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
