import Avatar from '@/components/Avatar'
import { formatDateVi } from '@/lib/format/dateTime'
import type { RecordTable } from '@/lib/hallOfFame/records'
import { formatDuration } from '@/lib/stats/format'

function RecordRow({ entry }: { entry: RecordTable['entries'][number] }) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
      <span className="w-6 text-center font-black">{entry.rank}</span>
      <Avatar url={entry.avatarUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{entry.displayName}</p>
        <p className="truncate text-xs text-muted">
          {entry.raceName} · {formatDateVi(`${entry.raceDate}T00:00:00+07:00`)}
        </p>
      </div>
      <span className="font-black">{formatDuration(entry.chipTimeSeconds)}</span>
    </li>
  )
}

export default function ClubRecordsView({ tables }: { tables: RecordTable[] }) {
  const filled = tables.filter((table) => table.entries.length > 0)
  if (filled.length === 0) return <p className="mt-4 text-muted">Chưa có kỷ lục nào được xác minh.</p>
  return (
    <div className="mt-4 flex flex-col gap-6">
      {filled.map((table) => (
        <section key={`${table.distanceKey}-${table.genderKey}`}>
          <h2 className="text-lg font-black">
            {table.distanceLabel} · {table.genderLabel}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {table.entries.map((entry) => (
              <RecordRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
