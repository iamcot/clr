import ActionForm from '@/components/ActionForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { adminButtonClass } from '@/components/admin/styles'
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

type ResultRow = Awaited<ReturnType<typeof loadResults>>[number]

function resultColumns(showVerified: boolean): DataTableColumn<ResultRow>[] {
  return [
    { key: 'member', header: 'Thành viên', cell: (result) => <b>{result.display_name}</b> },
    {
      key: 'race',
      header: 'Giải',
      cell: (result) => (
        <span>
          {result.race_name}
          <span className="block text-xs text-muted">
            {result.distance_label}
            {result.race_date && ` · ${formatDateVi(`${result.race_date}T00:00:00+07:00`)}`}
          </span>
        </span>
      ),
    },
    { key: 'time', header: 'Thành tích', cell: (result) => formatDuration(result.chip_time_s ?? 0) },
    {
      key: 'rank',
      header: 'BIB / hạng',
      hideBelowMd: true,
      cell: (result) => [result.bib && `BIB ${result.bib}`, result.rank_overall && `hạng ${result.rank_overall}`]
        .filter(Boolean)
        .join(' · '),
    },
    {
      key: 'certificate',
      header: 'Chứng nhận',
      hideBelowMd: true,
      cell: (result) =>
        result.certificate_url ? (
          <a href={result.certificate_url} target="_blank" rel="noreferrer" className="text-brand-dark underline">
            Xem
          </a>
        ) : (
          '—'
        ),
    },
    {
      key: 'action',
      header: '',
      cell: (result) => (
        <ActionForm action={verifyRaceResult}>
          <input type="hidden" name="result_id" value={result.id ?? ''} />
          <input type="hidden" name="verified" value={showVerified ? 'false' : 'true'} />
          <button type="submit" className={adminButtonClass(showVerified ? 'secondary' : 'primary')}>
            {showVerified ? 'Bỏ xác minh' : 'Xác minh'}
          </button>
        </ActionForm>
      ),
    },
  ]
}

export default async function AdminRacesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const showVerified = (await searchParams).show === 'verified'
  const results = await loadResults(showVerified)

  return (
    <section>
      <AdminPageHeader
        title="Kết quả giải"
        description="Đối chiếu với giấy chứng nhận hoặc trang kết quả của giải trước khi xác minh."
      />
      <AdminTabs
        items={[
          { href: '/admin/races', label: 'Chờ xác minh', active: !showVerified },
          { href: '/admin/races?show=verified', label: 'Đã xác minh', active: showVerified },
        ]}
      />
      <div className="mt-4">
        <DataTable
          columns={resultColumns(showVerified)}
          rows={results}
          rowKey={(result) => String(result.id)}
          emptyText="Không có kết quả nào."
        />
      </div>
    </section>
  )
}
