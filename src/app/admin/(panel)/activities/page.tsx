import ActionForm from '@/components/ActionForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import { formatFixed } from '@/lib/format/number'
import { setActivityFlag } from '@/lib/strava/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type ReviewRow = Database['public']['Views']['activities_review']['Row']

const PAGE_SIZE = 100

async function loadActivities(showCounted: boolean): Promise<ReviewRow[]> {
  const supabase = await createSupabaseServerClient()
  const query = supabase
    .from('activities_review')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(PAGE_SIZE)
  const { data } = await (showCounted ? query.eq('counts_for_club', true) : query.eq('counts_for_club', false))
  return data ?? []
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
  const fields = (
    <ActionForm action={setActivityFlag} className="flex flex-col gap-2 py-1">
      <input type="hidden" name="activity_id" value={activity.id ?? ''} />
      <input type="hidden" name="flagged" value={flagged ? 'false' : 'true'} />
      {!flagged && <input name="reason" placeholder="Lý do" required maxLength={200} className={ADMIN_INPUT_CLASS} />}
      <button type="submit" className={adminButtonClass(flagged ? 'secondary' : 'danger')}>
        {flagged ? 'Bỏ đánh dấu' : 'Đánh dấu không hợp lệ'}
      </button>
    </ActionForm>
  )
  if (flagged) return fields
  return (
    <details className="min-w-44">
      <summary className="flex min-h-8 cursor-pointer items-center text-sm font-bold text-brand-dark">Đánh dấu</summary>
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

export default async function AdminActivitiesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const showCounted = (await searchParams).show === 'counted'
  const activities = await loadActivities(showCounted)

  return (
    <section>
      <AdminPageHeader
        title="Hoạt động"
        description="Hoạt động riêng tư không hiện ở đây. Đánh dấu không hợp lệ để loại khỏi số liệu CLB."
      />
      <AdminTabs
        items={[
          { href: '/admin/activities', label: 'Bị loại', active: !showCounted },
          { href: '/admin/activities?show=counted', label: 'Đang được tính', active: showCounted },
        ]}
      />
      <div className="mt-4">
        <DataTable
          columns={COLUMNS}
          rows={activities}
          rowKey={(activity) => String(activity.id)}
          emptyText="Không có hoạt động nào."
        />
      </div>
    </section>
  )
}
