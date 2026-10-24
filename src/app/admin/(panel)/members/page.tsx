import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import Avatar from '@/components/Avatar'
import {
  ADMIN_MEMBER_PAGE_SIZE,
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
} from '@/config/members'
import { GENDER_OPTIONS } from '@/config/profile'
import { formatDateVi } from '@/lib/format/dateTime'
import { reviewMembers } from '@/lib/members/adminActions'
import { parseMemberFilter, toLikePattern, type MemberFilter } from '@/lib/members/memberFilter'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const INPUT_CLASS = ADMIN_INPUT_CLASS
const LIST_COLUMNS = 'id, display_name, member_code, member_type, gender, avatar_url, created_at, level' as const

async function loadMembers(filter: MemberFilter) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('members')
    .select(LIST_COLUMNS)
    .eq('status', filter.status)
    .order('created_at', { ascending: false })
    .limit(ADMIN_MEMBER_PAGE_SIZE)
  if (filter.search) query = query.ilike('display_name', toLikePattern(filter.search))
  if (filter.type) query = query.eq('member_type', filter.type)
  if (filter.gender) query = query.eq('gender', filter.gender)
  const { data } = await query
  return data ?? []
}

type MemberRow = Awaited<ReturnType<typeof loadMembers>>[number]

function StatusTabs({ filter }: { filter: MemberFilter }) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {MEMBER_STATUSES.map((status) => (
        <Link
          key={status}
          href={`/admin/members?status=${status}`}
          aria-current={status === filter.status ? 'page' : undefined}
          className={`flex min-h-11 shrink-0 items-center rounded-full px-4 font-bold ${
            status === filter.status ? 'bg-deep text-white' : 'border border-line bg-white text-ink'
          }`}
        >
          {MEMBER_STATUS_LABELS[status]}
        </Link>
      ))}
    </nav>
  )
}

function FilterForm({ filter }: { filter: MemberFilter }) {
  return (
    <form className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <input type="hidden" name="status" value={filter.status} />
      <input name="q" defaultValue={filter.search} placeholder="Tìm theo tên" className={`${INPUT_CLASS} col-span-2`} />
      <select name="type" defaultValue={filter.type ?? ''} className={INPUT_CLASS}>
        <option value="">Mọi loại</option>
        {MEMBER_TYPES.map((type) => (
          <option key={type} value={type}>
            {MEMBER_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <select name="gender" defaultValue={filter.gender ?? ''} className={INPUT_CLASS}>
        <option value="">Mọi giới tính</option>
        {GENDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className={adminButtonClass('secondary')}>
        Lọc
      </button>
    </form>
  )
}

function memberColumns(selectable: boolean): DataTableColumn<MemberRow>[] {
  const columns: DataTableColumn<MemberRow>[] = [
    {
      key: 'name',
      header: 'Thành viên',
      isLink: true,
      cell: (member) => (
        <span className="flex items-center gap-2">
          <Avatar url={member.avatar_url} size={32} />
          <span className="truncate">{member.display_name ?? 'Chưa có tên'}</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      cell: (member) =>
        member.member_type ? (
          <Badge tone={member.member_type === 'official' ? 'success' : 'neutral'}>
            {MEMBER_TYPE_LABELS[member.member_type]}
          </Badge>
        ) : (
          '—'
        ),
    },
    { key: 'level', header: 'Level', cell: (member) => `Lv ${member.level}` },
    { key: 'code', header: 'Mã', hideBelowMd: true, cell: (member) => member.member_code },
    {
      key: 'gender',
      header: 'Giới tính',
      hideBelowMd: true,
      cell: (member) => GENDER_OPTIONS.find((option) => option.value === member.gender)?.label ?? '—',
    },
    { key: 'joined', header: 'Tạo lúc', hideBelowMd: true, cell: (member) => formatDateVi(member.created_at) },
  ]
  if (!selectable) return columns
  const checkbox: DataTableColumn<MemberRow> = {
    key: 'select',
    header: '',
    cell: (member) => <input type="checkbox" name="member_id" value={member.id} aria-label="Chọn" className="size-5" />,
  }
  return [checkbox, ...columns]
}

function ReviewControls() {
  return (
    <AdminCard className="mt-4 flex flex-col gap-2">
      <p className="text-sm text-muted">Tick người cần xử lý, rồi chọn loại và bấm Duyệt, hoặc nhập lý do và bấm Từ chối.</p>
      <select name="member_type" defaultValue="" className={INPUT_CLASS}>
        <option value="">Chọn loại thành viên khi duyệt</option>
        {MEMBER_TYPES.map((type) => (
          <option key={type} value={type}>
            {MEMBER_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <button type="submit" name="decision" value="approve" className={adminButtonClass('primary')}>
        Duyệt
      </button>
      <input name="reason" placeholder="Lý do từ chối" maxLength={200} className={INPUT_CLASS} />
      <button type="submit" name="decision" value="reject" className={adminButtonClass('danger')}>
        Từ chối
      </button>
    </AdminCard>
  )
}

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const filter = parseMemberFilter(await searchParams)
  const members = await loadMembers(filter)
  const isPendingTab = filter.status === 'pending'

  return (
    <section>
      <AdminPageHeader
        title="Thành viên"
        description="Duyệt, tìm kiếm và quản lý thành viên"
        actions={
          <Link href="/admin/members/export" prefetch={false} className={adminButtonClass('secondary')}>
            Xuất CSV
          </Link>
        }
      />
      <StatusTabs filter={filter} />
      <FilterForm filter={filter} />
      <ActionForm action={reviewMembers}>
        <div className="mt-4">
          <DataTable
            columns={memberColumns(isPendingTab)}
            rows={members}
            rowKey={(member) => member.id}
            rowHref={(member) => `/admin/members/${member.id}`}
            emptyText="Không có thành viên nào."
          />
        </div>
        {isPendingTab && members.length > 0 && <ReviewControls />}
      </ActionForm>
    </section>
  )
}
