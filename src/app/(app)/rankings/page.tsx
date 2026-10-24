import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import { GENDER_OPTIONS } from '@/config/profile'
import { RANKING_PAGE_SIZE } from '@/config/levels'
import { activeMemberOf, getViewer } from '@/lib/auth/viewer'
import { formatKm } from '@/lib/stats/format'
import { levelName } from '@/lib/stats/level'
import { loadClubRankingRows, loadLevelRankingRows } from '@/lib/stats/loadRankings'
import { buildRankingPage, type RankedRow, type RankingMetric } from '@/lib/stats/ranking'
import { canShowOthersActivities } from '@/lib/settings/clubDisplayMode'
import { loadClubDisplayMode } from '@/lib/settings/loadClubDisplayMode'

const TABS: { metric: RankingMetric; label: string }[] = [
  { metric: 'month', label: 'Tháng này' },
  { metric: 'year', label: 'Năm nay' },
  { metric: 'level', label: 'Level' },
]

type SearchParams = { tab?: string; gender?: string; type?: string; page?: string }

function parseMetric(value: string | undefined): RankingMetric {
  return TABS.find((tab) => tab.metric === value)?.metric ?? 'month'
}

function buildHref(params: Required<Pick<SearchParams, 'tab'>> & Omit<SearchParams, 'tab'>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value)
  return `/rankings?${query.toString()}`
}

function valueText(row: RankedRow, metric: RankingMetric): string {
  if (metric === 'level') return `${row.value} điểm`
  return formatKm(row.value)
}

function RankingLine({ row, metric, highlight }: { row: RankedRow; metric: RankingMetric; highlight: boolean }) {
  return (
    <li className={`flex items-center gap-3 rounded-lg p-3 ${highlight ? 'bg-lime/30' : 'bg-white'}`}>
      <span className="w-8 text-center font-black">{row.rank}</span>
      <Avatar url={row.avatarUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{row.displayName ?? 'Thành viên'}</p>
        <p className="text-xs text-muted">
          Level {row.level} {levelName(row.level)}
        </p>
      </div>
      <span className="font-black">{valueText(row, metric)}</span>
    </li>
  )
}

export default async function RankingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const viewer = await getViewer()
  const member = activeMemberOf(viewer)
  const tabs = member ? TABS : TABS.filter((tab) => tab.metric === 'level')
  const params = await searchParams
  const metric = member ? parseMetric(params.tab) : 'level'
  const page = Math.max(1, Number(params.page) || 1)
  const enabled = canShowOthersActivities(await loadClubDisplayMode())
  const result = enabled
    ? buildRankingPage(
        member ? await loadClubRankingRows() : await loadLevelRankingRows(),
        metric,
        { gender: params.gender || null, memberType: params.type || null },
        member?.id ?? '',
        page,
        RANKING_PAGE_SIZE,
      )
    : null
  const base = { tab: metric, gender: params.gender, type: params.type }

  return (
    <section>
      <h1 className="text-2xl font-black">Xếp hạng CLB</h1>
      <div className="mt-3 flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.metric}
            href={buildHref({ ...base, tab: tab.metric })}
            aria-current={tab.metric === metric ? 'page' : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold ${
              tab.metric === metric ? 'bg-brand text-white' : 'bg-white text-ink'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <form method="get" className="mt-3 flex gap-2">
        <input type="hidden" name="tab" value={metric} />
        <select name="gender" defaultValue={params.gender ?? ''} className="min-h-11 flex-1 rounded-lg border border-line bg-white px-2">
          <option value="">Mọi giới tính</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={params.type ?? ''} className="min-h-11 flex-1 rounded-lg border border-line bg-white px-2">
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
      {!member && (
        <p className="mt-3 text-sm text-muted">Số km của từng người chỉ hiện với thành viên đã được duyệt.</p>
      )}
      {!result && (
        <p className="mt-4 rounded-lg bg-white shadow-sm p-3 text-sm text-muted">
          Bảng xếp hạng chưa mở vì CLB đang chờ Strava đồng ý cho hiển thị số liệu giữa các thành viên. Số liệu của bạn
          vẫn xem được ở trang Tôi.
        </p>
      )}
      {result && (
        <>
          {member && !member.share_stats_with_club && (
            <p className="mt-3 text-sm text-muted">
              Bạn không có trong bảng vì chưa bật chia sẻ số liệu.{' '}
              <Link href="/me/settings" className="font-bold text-brand-dark underline">
                Vào cài đặt
              </Link>
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {result.rows.map((row) => (
              <RankingLine key={row.memberId} row={row} metric={metric} highlight={row.memberId === member?.id} />
            ))}
          </ul>
          {result.hasMore && (
            <Link
              href={buildHref({ ...base, page: String(page + 1) })}
              className="mt-3 flex min-h-11 items-center justify-center font-bold text-brand-dark underline"
            >
              Xem thêm
            </Link>
          )}
          {result.ownRow && (
            <ul className="mt-3 border-t border-line pt-3">
              <RankingLine row={result.ownRow} metric={metric} highlight />
            </ul>
          )}
          {result.total === 0 && <p className="mt-4 text-muted">Chưa có ai trong bảng.</p>}
        </>
      )}
    </section>
  )
}
