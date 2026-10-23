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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <h2 className="font-black">{title}</h2>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  )
}

export default async function AdminSyncPage() {
  const state = await loadSyncState()
  const now = new Date()

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-black">Đồng bộ Strava</h1>
      <Card title="Hạn mức Strava đang dùng">
        {state.rates.length === 0 && <p className="text-muted">Chưa có số liệu.</p>}
        {state.rates.map((rate) => (
          <p key={rate.window_name}>
            {WINDOW_LABELS[rate.window_name]}:{' '}
            {currentUsage(
              rate.window_name,
              { limit: rate.request_limit, usage: rate.usage, updatedAt: new Date(rate.updated_at) },
              now,
            )}
            /{rate.request_limit}
          </p>
        ))}
      </Card>
      <Card title="Hàng đợi">
        <p>Event chưa xử lý: {state.pendingEvents}</p>
        <p>Job kéo lịch sử còn lại: {state.pendingJobs}</p>
        <p>Job kéo lịch sử thất bại: {state.failedJobs}</p>
      </Card>
      <Card title="Event lỗi">
        {state.failedEvents.length === 0 && <p className="text-muted">Không có.</p>}
        {state.failedEvents.map((event) => (
          <form key={event.id} action={retryStravaEvent} className="mt-2 border-t border-line pt-2">
            <input type="hidden" name="event_id" value={event.id} />
            <p>
              {event.object_type} {event.object_id} ({event.aspect_type})
            </p>
            <p className="text-danger">{event.error}</p>
            <button type="submit" className="mt-1 min-h-11 rounded-lg border border-line px-4 font-bold">
              Thử lại
            </button>
          </form>
        ))}
      </Card>
      <Card title="Thành viên mất kết nối Strava">
        {state.disconnected.length === 0 && <p className="text-muted">Không có.</p>}
        {state.disconnected.map((member) => (
          <p key={member.id}>{member.display_name}</p>
        ))}
      </Card>
    </section>
  )
}
