import { formatDateVi } from '@/lib/format/dateTime'
import type { OwnActivity } from '@/lib/strava/recentActivities'

function formatKm(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(2)} km`
}

function ActivityRow({ activity }: { activity: OwnActivity }) {
  return (
    <li className="rounded-lg bg-white p-3">
      <p className="font-bold">{activity.name || activity.sport_type}</p>
      <p className="text-sm text-muted">
        {formatDateVi(activity.start_date)} · {formatKm(activity.distance_m)}
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
        className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-brand-dark underline"
      >
        Xem trên Strava
      </a>
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
    </section>
  )
}
