import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { matchPrDistanceName } from '@/lib/races/raceInput'
import { deleteRaceResult, linkRaceActivity, setPrFromRaceResult } from '@/lib/races/raceActions'
import type { RaceResultView } from '@/lib/races/loadRaces'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatDuration } from '@/lib/stats/format'

const SMALL_BUTTON_CLASS = 'min-h-11 rounded-lg border border-line px-3 text-sm font-bold'

function OwnerActions({ result }: { result: RaceResultView }) {
  const canBePr = matchPrDistanceName(result.distanceLabel) !== null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Link href={`/me/races/${result.id}`} className={`${SMALL_BUTTON_CLASS} flex items-center`}>
        Sửa
      </Link>
      {canBePr && (
        <ActionForm action={setPrFromRaceResult}>
          <input type="hidden" name="result_id" value={result.id} />
          <button type="submit" className={SMALL_BUTTON_CLASS}>
            Dùng làm PR
          </button>
        </ActionForm>
      )}
      {result.suggestedActivityId !== null && (
        <ActionForm action={linkRaceActivity}>
          <input type="hidden" name="result_id" value={result.id} />
          <input type="hidden" name="activity_id" value={result.suggestedActivityId} />
          <button type="submit" className={SMALL_BUTTON_CLASS}>
            Gắn hoạt động Strava cùng ngày
          </button>
        </ActionForm>
      )}
      <ActionForm action={deleteRaceResult}>
        <input type="hidden" name="result_id" value={result.id} />
        <button type="submit" className={`${SMALL_BUTTON_CLASS} text-danger`}>
          Xoá
        </button>
      </ActionForm>
    </div>
  )
}

function ResultRow({ result, editable }: { result: RaceResultView; editable: boolean }) {
  return (
    <li className="rounded-lg bg-white shadow-sm p-3">
      <p className="font-bold">{result.raceName}</p>
      <p className="text-sm text-muted">
        {formatDateVi(`${result.raceDate}T00:00:00+07:00`)} · {result.distanceLabel}
        {result.city && ` · ${result.city}`}
      </p>
      <p className="mt-1 text-lg font-black">{formatDuration(result.chipTimeSeconds)}</p>
      <p className="text-sm text-muted">
        {result.rankOverall && `Hạng ${result.rankOverall}`}
        {result.rankAgeGroup && ` · nhóm tuổi ${result.rankAgeGroup}`}
        {result.verified && <span className="font-bold text-brand-dark"> · BCN đã xác minh</span>}
        {result.activityId !== null && ' · đã gắn hoạt động Strava'}
      </p>
      {result.certificateUrl && (
        <a href={result.certificateUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-dark underline">
          Giấy chứng nhận
        </a>
      )}
      {editable && <OwnerActions result={result} />}
    </li>
  )
}

export default function RaceResultsList({ results, editable }: { results: RaceResultView[]; editable: boolean }) {
  if (results.length === 0) return <p className="mt-2 text-sm text-muted">Chưa có giải nào.</p>
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {results.map((result) => (
        <ResultRow key={result.id} result={result} editable={editable} />
      ))}
    </ul>
  )
}
