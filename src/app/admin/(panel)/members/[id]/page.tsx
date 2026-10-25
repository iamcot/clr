import { notFound } from 'next/navigation'
import Avatar from '@/components/Avatar'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge, { type BadgeTone } from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import FormField from '@/components/admin/FormField'
import Pagination from '@/components/admin/Pagination'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
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
import AdminLoginSection from '@/components/AdminLoginSection'
import { requireBcn } from '@/lib/auth/requireBcn'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import { updateMember } from '@/lib/members/adminActions'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Json, MemberStatus } from '@/lib/types/database'


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

const TABS = ['info', 'history'] as const

const STATUS_TONES: Record<MemberStatus, BadgeTone> = {
  pending: 'warning',
  active: 'success',
  inactive: 'neutral',
  rejected: 'danger',
}

type HistoryRow = Awaited<ReturnType<typeof loadHistory>>[number]

const HISTORY_COLUMNS: DataTableColumn<HistoryRow>[] = [
  { key: 'time', header: 'Thời điểm', cell: (log) => formatDateTimeVi(log.created_at) },
  { key: 'action', header: 'Thao tác', cell: (log) => <b>{log.action}</b> },
  { key: 'actor', header: 'Người làm', hideBelowMd: true, cell: (log) => log.actorName },
  {
    key: 'change',
    header: 'Thay đổi',
    cell: (log) => (
      <span className="break-all text-xs">
        {formatChange(log.before)} → {formatChange(log.after)}
      </span>
    ),
  },
]

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const member = await loadMember(id)
  if (!member) notFound()
  const [history, viewer] = await Promise.all([loadHistory(id), requireBcn()])
  const tab = pickTab(TABS, query.tab, 'info')
  const basePath = `/admin/members/${id}`
  const pagedHistory = slicePage(history, parsePage(query.page))

  return (
    <section>
      <AdminPageHeader
        title={member.display_name ?? 'Chưa có tên'}
        backHref="/admin/members"
        backLabel="Danh sách"
        description={member.member_code}
        actions={<Badge tone={STATUS_TONES[member.status as MemberStatus]}>{MEMBER_STATUS_LABELS[member.status as MemberStatus]}</Badge>}
      />
      <AdminTabs
        items={[
          { href: basePath, label: 'Thông tin', active: tab === 'info' },
          { href: `${basePath}?tab=history`, label: `Lịch sử (${history.length})`, active: tab === 'history' },
        ]}
      />

      {tab === 'info' && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Thông tin">
              <div className="mb-3 flex items-center gap-3">
                <Avatar url={member.avatar_url} size={56} />
                <div>
                  <p className="font-black">{member.display_name ?? 'Chưa có tên'}</p>
                  <p className="text-sm text-muted">Level {member.level}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
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
            </AdminCard>
            <AdminCard title="Vai trò và trạng thái">
              <ActionForm action={updateMember} className="flex flex-col gap-3">
                <input type="hidden" name="member_id" value={member.id} />
                <FormField label="Loại">
                  <select name="member_type" defaultValue={member.member_type ?? ''} className={ADMIN_INPUT_CLASS}>
                    <option value="">Chưa chọn</option>
                    {MEMBER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {MEMBER_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Vai trò">
                  <select name="role" defaultValue={member.role} className={ADMIN_INPUT_CLASS}>
                    {MEMBER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {MEMBER_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Trạng thái"
                  hint="Ngưng: không vào được khu thành viên, không bị tính challenge, dữ liệu giữ nguyên."
                >
                  <select name="status" defaultValue={member.status} className={ADMIN_INPUT_CLASS}>
                    {MEMBER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {MEMBER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div>
                  <button type="submit" className={adminButtonClass('primary')}>
                    Lưu thay đổi
                  </button>
                </div>
              </ActionForm>
            </AdminCard>
          </div>
          {member.role === 'bcn' && member.status === 'active' && (
            <AdminLoginSection memberId={member.id} isSelf={member.id === viewer.id} />
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="mt-4">
          <DataTable
            columns={HISTORY_COLUMNS}
            rows={pagedHistory.rows}
            rowKey={(log) => String(log.id)}
            emptyText="Chưa có thay đổi nào."
          />
          <Pagination window={pagedHistory.window} hrefFor={(page) => hrefWithPage(basePath, query, page)} unit="thay đổi" />
        </div>
      )}
    </section>
  )
}
