import ActionForm from '@/components/ActionForm'
import { removePrOverride } from '@/lib/races/raceActions'
import { formatDuration, formatPace } from '@/lib/stats/format'
import { PR_DISTANCES } from '@/config/prDistances'
import type { PersonalRecord } from '@/lib/stats/personalRecords'

const SOURCE_LABELS: Record<PersonalRecord['source'], string> = {
  strava: 'Strava',
  race: 'Giải chính thức',
  manual: 'Tự nhập',
}

function distanceMetersOf(record: PersonalRecord): number {
  return PR_DISTANCES.find((distance) => distance.name === record.distanceName)?.distanceMeters ?? 0
}

function RecordRow({ record, editable }: { record: PersonalRecord; editable: boolean }) {
  const hasOverride = record.source !== 'strava'
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
      <div>
        <p className="font-bold">{record.label}</p>
        <p className="text-sm text-muted">
          {SOURCE_LABELS[record.source]} · {formatPace(distanceMetersOf(record), record.timeSeconds)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black">{formatDuration(record.timeSeconds)}</p>
        {editable && hasOverride && (
          <ActionForm action={removePrOverride}>
            <input type="hidden" name="distance_name" value={record.distanceName} />
            <button type="submit" className="min-h-11 text-sm text-muted underline">
              Dùng PR Strava
            </button>
          </ActionForm>
        )}
      </div>
    </li>
  )
}

export default function PersonalRecordsCard({ records, editable }: { records: PersonalRecord[]; editable: boolean }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">Thành tích cá nhân (PR)</h2>
      {records.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có PR nào.</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {records.map((record) => (
          <RecordRow key={record.distanceName} record={record} editable={editable} />
        ))}
      </ul>
    </section>
  )
}
