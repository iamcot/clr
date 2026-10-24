import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import { EVENT_QUEUE } from '@/config/strava'
import { currentUsage, type RateWindowName } from '@/lib/strava/rateLimit'
import { retryStravaEvent } from '@/lib/strava/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const WINDOW_LABELS: Record<RateWindowName, string> = {
  read_15m: 'Đọc / 15 phút',
  read_day: 'Đọc / ngày',
  all_15m: 'Tổng / 15 phút',
  all_day: 'Tổng / ngày',
}

async function loadSyncState() {
  const supabase = await createSupabaseServerClient()
  const [rates, pendingEvents, failedEvents, pendingJobs, failedJobs, disconnected] = await Promise.all([
    supabase.from('strava_rate_state').select('*'),
    supabase
      .from('strava_events')
      .select('id', { count: 'exact', head: true })
      .is('processed_at', null)
      .lt('attempts', EVENT_QUEUE.maxAttempts),
    supabase
      .from('strava_events')
      .select('id, object_type, object_id, aspect_type, error, received_at')
      .is('processed_at', null)
      .gte('attempts', EVENT_QUEUE.maxAttempts)
      .order('received_at', { ascending: false })
      .limit(50),
    supabase.from('backfill_jobs').select('member_id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('backfill_jobs').select('member_id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('members').select('id, display_name').eq('status', 'active').eq('strava_connected', false),
  ])
  return {
    rates: rates.data ?? [],
    pendingEvents: pendingEvents.count ?? 0,
    failedEvents: failedEvents.data ?? [],
    pendingJobs: pendingJobs.count ?? 0,
    failedJobs: failedJobs.count ?? 0,
    disconnected: disconnected.data ?? [],
  }
}

export default async function AdminSyncPage() {
  const state = await loadSyncState()
  const now = new Date()

  return (
    <section>
      <AdminPageHeader title="Đồng bộ Strava" description="Hạn mức, hàng đợi và các event cần xử lý" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Event chưa xử lý" value={state.pendingEvents} />
        <StatCard label="Job lịch sử còn lại" value={state.pendingJobs} />
        <StatCard label="Job lịch sử thất bại" value={state.failedJobs} tone={state.failedJobs > 0 ? 'alert' : 'default'} />
        <StatCard
          label="Mất kết nối Strava"
          value={state.disconnected.length}
          tone={state.disconnected.length > 0 ? 'alert' : 'default'}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Hạn mức Strava đang dùng">
          {state.rates.length === 0 && <p className="text-sm text-muted">Chưa có số liệu.</p>}
          <ul className="divide-y divide-hairline text-sm">
            {state.rates.map((rate) => (
              <li key={rate.window_name} className="flex justify-between py-2">
                <span className="text-muted">{WINDOW_LABELS[rate.window_name]}</span>
                <b>
                  {currentUsage(
                    rate.window_name,
                    { limit: rate.request_limit, usage: rate.usage, updatedAt: new Date(rate.updated_at) },
                    now,
                  )}
                  /{rate.request_limit}
                </b>
              </li>
            ))}
          </ul>
        </AdminCard>
        <AdminCard title="Thành viên mất kết nối Strava">
          {state.disconnected.length === 0 && <p className="text-sm text-muted">Không có.</p>}
          <ul className="divide-y divide-hairline text-sm">
            {state.disconnected.map((member) => (
              <li key={member.id} className="py-2">
                {member.display_name}
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
      <AdminCard title="Event lỗi" className="mt-4">
        {state.failedEvents.length === 0 && <p className="text-sm text-muted">Không có.</p>}
        <ul className="divide-y divide-hairline">
          {state.failedEvents.map((event) => (
            <li key={event.id} className="py-3">
              <ActionForm action={retryStravaEvent} className="flex items-center justify-between gap-3">
                <input type="hidden" name="event_id" value={event.id} />
                <div className="min-w-0 text-sm">
                  <p className="font-bold">
                    {event.object_type} {event.object_id} ({event.aspect_type})
                  </p>
                  <p className="break-words text-danger">{event.error}</p>
                </div>
                <button type="submit" className={adminButtonClass('secondary')}>
                  Thử lại
                </button>
              </ActionForm>
            </li>
          ))}
        </ul>
      </AdminCard>
    </section>
  )
}
