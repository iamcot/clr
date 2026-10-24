import Link from 'next/link'
import BackLink from '@/components/BackLink'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import { summarizeMembers, type MemberSummary } from '@/lib/challenges/summary'
import { loadSummaryEntries } from '@/lib/challenges/loadSummary'

type SortKey = 'joined' | 'completed' | 'longestStreak' | 'currentStreak'
type SearchParams = { year?: string; type?: string; sort?: string }

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'joined', label: 'Tham gia' },
  { key: 'completed', label: 'Hoàn thành' },
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

export default async function ChallengeSummaryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const year = Number(params.year) || new Date().getFullYear()
  const sort = parseSort(params.sort)
  const { entries, names } = await loadSummaryEntries(year, params.type || null)
  const rows = sortRows(summarizeMembers(entries), sort, names)

  return (
    <section>
      <BackLink href="/admin/challenges">Challenge</BackLink>
      <h1 className="mt-2 text-2xl font-black">Tổng hợp nhiều kỳ</h1>
      <p className="text-sm text-muted">Chỉ tính các challenge đã chốt.</p>
      <form method="get" className="mt-3 flex gap-2">
        <input type="hidden" name="sort" value={sort} />
        <input
          name="year"
          type="number"
          defaultValue={year}
          className="min-h-11 w-24 rounded-lg border border-line bg-white px-3"
        />
        <select
          name="type"
          defaultValue={params.type ?? ''}
          className="min-h-11 flex-1 rounded-lg border border-line bg-white px-2"
        >
          <option value="">Mọi loại</option>
          {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-lg border border-line px-3 font-bold">
          Lọc
        </button>
      </form>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {SORT_COLUMNS.map((column) => (
          <Link
            key={column.key}
            href={`/admin/challenges/summary?year=${year}&type=${params.type ?? ''}&sort=${column.key}`}
            className={`flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-bold ${
              column.key === sort ? 'bg-brand text-white' : 'bg-white'
            }`}
          >
            {column.label}
          </Link>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.memberId} className="rounded-lg bg-white shadow-sm p-3">
            <p className="font-bold">{names[row.memberId] ?? 'Thành viên'}</p>
            <p className="text-sm text-muted">
              Tham gia {row.joined} · Hoàn thành {row.completed} · Chuỗi dài nhất {row.longestStreak} tháng · Chuỗi hiện
              tại {row.currentStreak} tháng
            </p>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="mt-4 text-muted">Chưa có challenge nào đã chốt trong năm này.</p>}
    </section>
  )
}
