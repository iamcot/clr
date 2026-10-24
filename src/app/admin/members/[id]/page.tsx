import { notFound } from 'next/navigation'
import Avatar from '@/components/Avatar'
import BackLink from '@/components/BackLink'
import ActionForm from '@/components/ActionForm'
import {
  MEMBER_HISTORY_LIMIT,
  MEMBER_ROLES,
  MEMBER_ROLE_LABELS,
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
} from '@/config/members'
import { updateMember } from '@/lib/members/adminActions'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/types/database'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'

async function loadMember(memberId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members').select('*').eq('id', memberId).maybeSingle()
  return data
}

async function loadHistory(memberId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, before, after, created_at')
    .eq('target_table', 'members')
    .eq('target_id', memberId)
    .order('created_at', { ascending: false })
    .limit(MEMBER_HISTORY_LIMIT)
  const actorIds = [...new Set((logs ?? []).flatMap((log) => (log.actor_id ? [log.actor_id] : [])))]
  const { data: actors } = await supabase.from('members').select('id, display_name').in('id', actorIds)
  const actorNames = new Map((actors ?? []).map((actor) => [actor.id, actor.display_name ?? 'BCN']))
  return (logs ?? []).map((log) => ({ ...log, actorName: actorNames.get(log.actor_id ?? '') ?? 'Hệ thống' }))
}

function formatChange(value: Json): string {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? JSON.stringify(value) : ''
}

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await loadMember(id)
  if (!member) notFound()
  const history = await loadHistory(id)

  return (
    <section>
      <BackLink href="/admin/members">Danh sách</BackLink>
      <div className="mt-3 flex items-center gap-3">
        <Avatar url={member.avatar_url} size={64} />
        <div>
          <h1 className="text-2xl font-black">{member.display_name ?? 'Chưa có tên'}</h1>
          <p className="text-sm text-muted">
            {member.member_code} · {MEMBER_STATUS_LABELS[member.status]}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-white shadow-sm p-3 text-sm">
        <dt className="text-muted">SĐT</dt>
        <dd>{member.phone ?? '—'}</dd>
        <dt className="text-muted">Năm sinh</dt>
        <dd>{member.birth_year ?? '—'}</dd>
        <dt className="text-muted">Ngày vào</dt>
        <dd>{member.joined_at ? formatDateTimeVi(member.joined_at) : '—'}</dd>
        <dt className="text-muted">Kết nối Strava</dt>
        <dd>{member.strava_connected ? 'Đang kết nối' : 'Đã ngắt'}</dd>
        {member.rejection_reason && (
          <>
            <dt className="text-muted">Lý do từ chối</dt>
            <dd>{member.rejection_reason}</dd>
          </>
        )}
      </dl>
      <ActionForm action={updateMember} className="mt-4 flex flex-col gap-3 rounded-lg bg-white shadow-sm p-3">
        <input type="hidden" name="member_id" value={member.id} />
        <label className="block">
          <span className="text-sm font-bold">Loại</span>
          <select name="member_type" defaultValue={member.member_type ?? ''} className={`${INPUT_CLASS} mt-1`}>
            <option value="">Chưa chọn</option>
            {MEMBER_TYPES.map((type) => (
              <option key={type} value={type}>
                {MEMBER_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold">Vai trò</span>
          <select name="role" defaultValue={member.role} className={`${INPUT_CLASS} mt-1`}>
            {MEMBER_ROLES.map((role) => (
              <option key={role} value={role}>
                {MEMBER_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold">Trạng thái</span>
          <select name="status" defaultValue={member.status} className={`${INPUT_CLASS} mt-1`}>
            {MEMBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MEMBER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          Chuyển sang Ngưng: thành viên không vào được khu thành viên, không bị tính challenge, dữ liệu giữ nguyên.
        </p>
        <button type="submit" className="min-h-11 rounded-lg bg-brand px-4 font-bold text-white">
          Lưu thay đổi
        </button>
      </ActionForm>
      <h2 className="mt-6 text-lg font-black">Lịch sử thay đổi</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {history.map((log) => (
          <li key={log.id} className="rounded-lg bg-white shadow-sm p-3 text-sm">
            <p className="font-bold">
              {log.action} · {log.actorName}
            </p>
            <p className="text-muted">{formatDateTimeVi(log.created_at)}</p>
            <p className="break-all">
              {formatChange(log.before)} → {formatChange(log.after)}
            </p>
          </li>
        ))}
      </ul>
      {history.length === 0 && <p className="mt-2 text-muted">Chưa có thay đổi nào.</p>}
    </section>
  )
}
