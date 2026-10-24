import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { summarizeMembers, type MemberSummary } from '@/lib/challenges/summary'
import { loadSummaryEntries } from '@/lib/challenges/loadSummary'

type SortKey = 'joined' | 'completed' | 'longestStreak' | 'currentStreak'
type SearchParams = { year?: string; type?: string; sort?: string; page?: string }

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'joined', label: 'Tham gia' },
  { key: 'longestStreak', label: 'Chuỗi dài nhất' },
  { key: 'currentStreak', label: 'Chuỗi hiện tại' },
]

function parseSort(value: string | undefined): SortKey {
  return SORT_COLUMNS.find((column) => column.key === value)?.key ?? 'completed'
}

function sortRows(rows: MemberSummary[], key: SortKey, names: Record<string, string>): MemberSummary[] {
  return [...rows].sort(
    (a, b) => b[key] - a[key] || (names[a.memberId] ?? '').localeCompare(names[b.memberId] ?? '', 'vi'),
  )
}

function summaryColumns(names: Record<string, string>): DataTableColumn<MemberSummary>[] {
  return [
    { key: 'name', header: 'Thành viên', cell: (row) => <b>{names[row.memberId] ?? 'Thành viên'}</b> },
    { key: 'joined', header: 'Tham gia', align: 'right', cell: (row) => row.joined },
    { key: 'completed', header: 'Hoàn thành', align: 'right', cell: (row) => row.completed },
    { key: 'longest', header: 'Chuỗi dài nhất', align: 'right', hideBelowMd: true, cell: (row) => `${row.longestStreak} tháng` },
    { key: 'current', header: 'Chuỗi hiện tại', align: 'right', hideBelowMd: true, cell: (row) => `${row.currentStreak} tháng` },
  ]
}

export default async function ChallengeSummaryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const year = Number(params.year) || new Date().getFullYear()
  const sort = parseSort(params.sort)
  const { entries, names } = await loadSummaryEntries(year, params.type || null)
  const paged = slicePage(sortRows(summarizeMembers(entries), sort, names), parsePage(params.page))
  const base = { year: String(year), type: params.type }

  return (
    <section>
      <AdminPageHeader
        title="Tổng hợp nhiều kỳ"
        description="Chỉ tính các challenge đã chốt."
        backHref="/admin/challenges"
        backLabel="Challenge"
      />
      <form method="get" className="mb-3 flex flex-wrap gap-2">
        <input type="hidden" name="sort" value={sort} />
        <input name="year" type="number" defaultValue={year} aria-label="Năm" className={`${ADMIN_INPUT_CLASS} w-28`} />
        <select name="type" defaultValue={params.type ?? ''} aria-label="Loại thành viên" className={`${ADMIN_INPUT_CLASS} w-44`}>
          <option value="">Mọi loại</option>
          {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={adminButtonClass('secondary')}>
          Lọc
        </button>
      </form>
      <AdminTabs
        items={SORT_COLUMNS.map((column) => ({
          href: hrefWithPage('/admin/challenges/summary', { ...base, sort: column.key }, 1),
          label: column.label,
          active: column.key === sort,
        }))}
      />
      <div className="mt-4">
        <DataTable
          columns={summaryColumns(names)}
          rows={paged.rows}
          rowKey={(row) => row.memberId}
          emptyText="Chưa có challenge nào đã chốt trong năm này."
        />
        <Pagination
          window={paged.window}
          hrefFor={(page) => hrefWithPage('/admin/challenges/summary', { ...base, sort, page: undefined }, page)}
          unit="thành viên"
        />
      </div>
    </section>
  )
}
