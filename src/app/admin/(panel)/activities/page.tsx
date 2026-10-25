import ActionForm from '@/components/ActionForm'
import DateInput from '@/components/admin/DateInput'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import MultiSelectDropdown from '@/components/MultiSelectDropdown'
import { ACTIVITY_SPORT_GROUPS, ACTIVITY_SPORT_GROUP_LABELS } from '@/config/admin'
import {
  buildSportClause,
  dayEndIso,
  dayStartIso,
  parseActivityFilter,
  type ActivityFilter,
  type RawActivityParams,
} from '@/lib/admin/activityFilter'
import { describePage, hrefWithPage, pageRange } from '@/lib/admin/pagination'
import { formatFixed } from '@/lib/format/number'
import { setActivityFlag } from '@/lib/strava/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type ReviewRow = Database['public']['Views']['activities_review']['Row']

const MEMBER_PICKER_LIMIT = 800

async function loadActivities(filter: ActivityFilter) {
  const supabase = await createSupabaseServerClient()
  const { from, to } = pageRange(filter.page)
  let query = supabase
    .from('activities_review')
    .select('*', { count: 'exact' })
    .eq('counts_for_club', filter.tab === 'counted')
    .order('start_date', { ascending: false })
    .range(from, to)
  if (filter.from) query = query.gte('start_date', dayStartIso(filter.from))
  if (filter.to) query = query.lte('start_date', dayEndIso(filter.to))
  if (filter.memberIds.length > 0) query = query.in('member_id', filter.memberIds)
  const sportClause = buildSportClause(filter.sports)
  if (sportClause) query = query.or(sportClause)
  const { data, count } = await query
  return { rows: (data ?? []) as ReviewRow[], total: count ?? 0 }
}

async function loadMemberOptions() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('members')
    .select('id, display_name')
    .eq('status', 'active')
    .order('display_name')
    .range(0, MEMBER_PICKER_LIMIT - 1)
  return (data ?? []).map((member) => ({ id: member.id, title: member.display_name ?? 'Chưa có tên' }))
}

function formatDistanceKm(distanceMeters: number | null): string {
  return `${formatFixed((distanceMeters ?? 0) / 1000, 2)} km`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso))
}

function exclusionNote(activity: ReviewRow): string {
  if (activity.flagged_invalid) return `BCN đánh dấu: ${activity.invalid_reason ?? ''}`
  if (!activity.counts_for_club) return activity.manual ? 'Nhập tay' : `Loại (${activity.sport_type})`
  return ''
}

function FlagForm({ activity }: { activity: ReviewRow }) {
  const flagged = activity.flagged_invalid === true
  const counted = activity.counts_for_club === true
  if (!flagged && !counted) return null
  const fields = (
    <ActionForm action={setActivityFlag} className="flex flex-col gap-2 py-1">
      <input type="hidden" name="activity_id" value={activity.id ?? ''} />
      <input type="hidden" name="flagged" value={flagged ? 'false' : 'true'} />
      {!flagged && <input name="reason" placeholder="Lý do" required maxLength={200} className={ADMIN_INPUT_CLASS} />}
      <button type="submit" className={adminButtonClass(flagged ? 'secondary' : 'danger')}>
        {flagged ? 'Bỏ đánh dấu, tính lại' : 'Đánh dấu không hợp lệ'}
      </button>
    </ActionForm>
  )
  if (flagged) return fields
  return (
    <details className="min-w-44">
      <summary className="flex min-h-8 cursor-pointer items-center text-sm font-bold text-brand-dark">Loại</summary>
      {fields}
    </details>
  )
}

const COLUMNS: DataTableColumn<ReviewRow>[] = [
  { key: 'member', header: 'Thành viên', cell: (activity) => <b>{activity.display_name}</b> },
  {
    key: 'activity',
    header: 'Hoạt động',
    cell: (activity) => (
      <span>
        {activity.name}
        <span className="block text-xs text-muted">{activity.sport_type}</span>
      </span>
    ),
  },
  { key: 'distance', header: 'Cự ly', align: 'right', cell: (activity) => formatDistanceKm(activity.distance_m) },
  { key: 'date', header: 'Ngày', hideBelowMd: true, cell: (activity) => formatDate(activity.start_date) },
  {
    key: 'note',
    header: 'Ghi chú',
    hideBelowMd: true,
    cell: (activity) => {
      const note = exclusionNote(activity)
      return note ? <Badge tone={activity.flagged_invalid ? 'danger' : 'neutral'}>{note}</Badge> : null
    },
  },
  { key: 'action', header: '', cell: (activity) => <FlagForm activity={activity} /> },
]

function FilterForm({
  filter,
  members,
}: {
  filter: ActivityFilter
  members: { id: string; title: string }[]
}) {
  return (
    <form method="get" className="mt-3 grid gap-2 md:grid-cols-6">
      <input type="hidden" name="show" value={filter.tab} />
      <DateInput type="date" name="from" defaultValue={filter.from ?? ''} aria-label="Từ ngày" />
      <DateInput type="date" name="to" defaultValue={filter.to ?? ''} aria-label="Đến ngày" />
      <div className="md:col-span-2">
        <MultiSelectDropdown name="member" options={members} placeholder="Mọi thành viên" defaultSelected={filter.memberIds} />
      </div>
      <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-1 md:col-span-2">
        <legend className="sr-only">Loại hình</legend>
        {ACTIVITY_SPORT_GROUPS.map((group) => (
          <label key={group} className="flex min-h-9 items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              name="sport"
              value={group}
              defaultChecked={filter.sports.includes(group)}
              className="size-4 accent-brand"
            />
            {ACTIVITY_SPORT_GROUP_LABELS[group]}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2 md:col-span-6">
        <button type="submit" className={adminButtonClass('primary')}>
          Lọc
        </button>
        <a href={`/admin/activities?show=${filter.tab}`} className={adminButtonClass('secondary')}>
          Xoá lọc
        </a>
      </div>
    </form>
  )
}

export default async function AdminActivitiesPage({ searchParams }: { searchParams: Promise<RawActivityParams> }) {
  const raw = await searchParams
  const filter = parseActivityFilter(raw)
  const [{ rows, total }, members] = await Promise.all([loadActivities(filter), loadMemberOptions()])
  const window = describePage(filter.page, total)
  const tabParams = { ...raw, page: undefined }

  return (
    <section>
      <AdminPageHeader
        title="Hoạt động"
        description="Hoạt động riêng tư không hiện ở đây. BCN có thể loại một hoạt động đang tính và tính lại sau đó. Hoạt động bị loại vì không phải môn chạy hoặc nhập tay thì không đổi được."
      />
      <AdminTabs
        items={[
          { href: hrefWithPage('/admin/activities', { ...tabParams, show: undefined }, 1), label: 'Đang được tính', active: filter.tab === 'counted' },
          { href: hrefWithPage('/admin/activities', { ...tabParams, show: 'excluded' }, 1), label: 'Bị loại', active: filter.tab === 'excluded' },
        ]}
      />
      <FilterForm filter={filter} members={members} />
      <div className="mt-4">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(activity) => String(activity.id)}
          emptyText="Không có hoạt động nào."
        />
        <Pagination window={window} hrefFor={(page) => hrefWithPage('/admin/activities', raw, page)} unit="hoạt động" />
      </div>
    </section>
  )
}
