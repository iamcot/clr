import { formatKm, formatPace } from '@/lib/stats/format'
import type { PeriodStats } from '@/lib/stats/loadStatsPeriods'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  )
}

export default function QuickStats({ month, year }: { month: PeriodStats; year: PeriodStats }) {
  return (
    <section className="mt-4 grid grid-cols-2 gap-2">
      <Stat label="Km tháng này" value={formatKm(month.distanceMeters)} />
      <Stat label="Km năm nay" value={formatKm(year.distanceMeters)} />
      <Stat label="Số buổi tháng này" value={String(month.activityCount)} />
      <Stat label="Pace TB tháng này" value={formatPace(month.distanceMeters, month.movingTimeSeconds)} />
    </section>
  )
}
