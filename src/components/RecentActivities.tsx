import RouteMap from '@/components/RouteMap'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatKm, formatPace } from '@/lib/stats/format'
import type { OwnActivity } from '@/lib/strava/recentActivities'

function ActivityRow({ activity }: { activity: OwnActivity }) {
  return (
    <li className="flex gap-3 rounded-lg bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{activity.name || activity.sport_type}</p>
        <p className="text-sm text-muted">
          {formatDateVi(activity.start_date)} · {formatKm(activity.distance_m)} ·{' '}
          {formatPace(activity.distance_m, activity.moving_time_s)}
        </p>
        {!activity.counts_for_club && (
          <p className="text-sm text-danger">
            {activity.flagged_invalid ? 'BCN đánh dấu không hợp lệ' : 'Không được tính cho CLB'}
          </p>
        )}
        <a
          href={`https://www.strava.com/activities/${activity.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-bold text-brand-dark underline"
        >
          View on Strava
        </a>
      </div>
      <RouteMap polyline={activity.summary_polyline} />
    </li>
  )
}

export default function RecentActivities({ activities }: { activities: OwnActivity[] }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">Hoạt động gần đây</h2>
      {activities.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có hoạt động nào được đồng bộ.</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </ul>
      {activities.length > 0 && <p className="mt-2 text-xs text-muted">Powered by Strava</p>}
    </section>
  )
}
