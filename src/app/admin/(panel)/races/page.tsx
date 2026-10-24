import ActionForm from '@/components/ActionForm'
import { formatDateVi } from '@/lib/format/dateTime'
import { verifyRaceResult } from '@/lib/races/adminRaceActions'
import { formatDuration } from '@/lib/stats/format'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const PAGE_SIZE = 100

async function loadResults(showVerified: boolean) {
  const supabase = await createSupabaseServerClient()
  const query = supabase.from('race_results_review').select('*').order('race_date', { ascending: false }).limit(PAGE_SIZE)
  const { data } = await (showVerified ? query.not('verified_at', 'is', null) : query.is('verified_at', null))
  return data ?? []
}

export default async function AdminRacesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const showVerified = (await searchParams).show === 'verified'
  const results = await loadResults(showVerified)

  return (
    <section>
      <h1 className="text-2xl font-black">Kết quả giải</h1>
      <p className="mt-1 text-sm text-muted">
        {showVerified ? 'Kết quả đã xác minh' : 'Kết quả chờ xác minh'}. Đối chiếu với giấy chứng nhận hoặc trang kết
        quả của giải.
      </p>
      <a
        href={showVerified ? '/admin/races' : '/admin/races?show=verified'}
        className="mt-2 block font-bold text-brand-dark underline"
      >
        {showVerified ? 'Xem kết quả chờ xác minh' : 'Xem kết quả đã xác minh'}
      </a>
      <ul className="mt-4 flex flex-col gap-3">
        {results.map((result) => (
          <li key={result.id} className="rounded-lg bg-white p-3">
            <p className="font-bold">{result.display_name}</p>
            <p className="text-sm">
              {result.race_name} · {result.distance_label} · {formatDuration(result.chip_time_s ?? 0)}
            </p>
            <p className="text-sm text-muted">
              {result.race_date && formatDateVi(`${result.race_date}T00:00:00+07:00`)}
              {result.bib && ` · BIB ${result.bib}`}
              {result.rank_overall && ` · hạng ${result.rank_overall}`}
            </p>
            {result.certificate_url && (
              <a href={result.certificate_url} target="_blank" rel="noreferrer" className="text-sm text-brand-dark underline">
                Giấy chứng nhận
              </a>
            )}
            <ActionForm action={verifyRaceResult} className="mt-2">
              <input type="hidden" name="result_id" value={result.id ?? ''} />
              <input type="hidden" name="verified" value={showVerified ? 'false' : 'true'} />
              <button type="submit" className="min-h-11 rounded-lg border border-hairline px-4 font-bold">
                {showVerified ? 'Bỏ xác minh' : 'Xác minh'}
              </button>
            </ActionForm>
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="mt-4 text-muted">Không có kết quả nào.</p>}
    </section>
  )
}
