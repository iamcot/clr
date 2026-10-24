'use server'

import { revalidatePath } from 'next/cache'
import { MEMBER_ROLES, MEMBER_STATUSES, MEMBER_TYPES } from '@/config/members'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import type { MemberRole, MemberStatus, MemberType } from '@/lib/types/database'

const RAISED_EXCEPTION_CODE = 'P0001'
const REASON_MAX_LENGTH = 200

function readChoice<T extends string>(allowed: readonly T[], value: FormDataEntryValue | null): T | null {
  return allowed.find((item) => item === value) ?? null
}

function readReason(formData: FormData): string {
  return String(formData.get('reason') ?? '')
    .trim()
    .slice(0, REASON_MAX_LENGTH)
}

function toErrorResult(error: { code?: string; message: string }): ActionResult {
  if (error.code === RAISED_EXCEPTION_CODE) return actionError(error.message)
  return actionError('Không thực hiện được, vui lòng thử lại')
}

export async function reviewMembers(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const memberIds = formData.getAll('member_id').map(String)
  if (memberIds.length === 0) return actionError('Chưa chọn ai')

  const approve = formData.get('decision') === 'approve'
  const memberType = readChoice<MemberType>(MEMBER_TYPES, formData.get('member_type'))
  if (approve && !memberType) return actionError('Cần chọn loại thành viên')
  const reason = readReason(formData)
  if (!approve && !reason) return actionError('Cần nhập lý do từ chối')

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_review_members', {
    p_member_ids: memberIds,
    p_approve: approve,
    p_member_type: approve ? memberType : null,
    p_reason: approve ? null : reason,
  })
  if (error) return toErrorResult(error)

  revalidatePath('/admin/members')
  return actionSuccess(`${approve ? 'Đã duyệt' : 'Đã từ chối'} ${data} thành viên`)
}

export async function updateMember(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const memberId = String(formData.get('member_id') ?? '')
  const role = readChoice<MemberRole>(MEMBER_ROLES, formData.get('role'))
  const status = readChoice<MemberStatus>(MEMBER_STATUSES, formData.get('status'))
  if (!memberId || !role || !status) return actionError('Thông tin không hợp lệ')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('admin_update_member', {
    p_member_id: memberId,
    p_member_type: readChoice<MemberType>(MEMBER_TYPES, formData.get('member_type')),
    p_role: role,
    p_status: status,
  })
  if (error) return toErrorResult(error)

  revalidatePath('/admin/members')
  revalidatePath(`/admin/members/${memberId}`)
  return actionSuccess('Đã cập nhật thành viên')
}
