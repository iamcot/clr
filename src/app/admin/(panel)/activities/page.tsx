import ActionForm from '@/components/ActionForm'
import { formatFixed } from '@/lib/format/number'
import { setActivityFlag } from '@/lib/strava/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type ReviewRow = Database['public']['Views']['activities_review']['Row']

const PAGE_SIZE = 100
const INPUT_CLASS = 'min-h-10 w-full rounded-lg border border-hairline bg-white px-2.5 text-sm md:min-h-8'

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
  return (
    <ActionForm action={setActivityFlag} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="activity_id" value={activity.id ?? ''} />
      <input type="hidden" name="flagged" value={flagged ? 'false' : 'true'} />
      {!flagged && <input name="reason" placeholder="Lý do" required maxLength={200} className={INPUT_CLASS} />}
      <button type="submit" className="min-h-11 rounded-lg border border-hairline px-4 font-bold">
        {flagged ? 'Bỏ đánh dấu không hợp lệ' : 'Đánh dấu không hợp lệ'}
      </button>
    </ActionForm>
  )
}

export default async function AdminActivitiesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const showCounted = (await searchParams).show === 'counted'
  const activities = await loadActivities(showCounted)

  return (
    <section>
      <h1 className="text-2xl font-black">Hoạt động</h1>
      <p className="mt-1 text-sm text-muted">
        {showCounted ? 'Hoạt động đang được tính cho CLB' : 'Hoạt động bị loại'}. Hoạt động riêng tư không
        hiện ở đây.
      </p>
      <a
        href={showCounted ? '/admin/activities' : '/admin/activities?show=counted'}
        className="mt-2 block font-bold text-brand-dark underline"
      >
        {showCounted ? 'Xem hoạt động bị loại' : 'Xem hoạt động đang được tính'}
      </a>
      <ul className="mt-4 flex flex-col gap-3">
        {activities.map((activity) => (
          <li key={activity.id} className="rounded-lg bg-white p-3">
            <p className="font-bold">{activity.display_name}</p>
            <p className="text-sm">
              {activity.name} · {activity.sport_type} · {formatDistanceKm(activity.distance_m)} ·{' '}
              {formatDate(activity.start_date)}
            </p>
            <p className="text-sm text-muted">{exclusionNote(activity)}</p>
            <FlagForm activity={activity} />
          </li>
        ))}
      </ul>
      {activities.length === 0 && <p className="mt-4 text-muted">Không có hoạt động nào.</p>}
    </section>
  )
}
