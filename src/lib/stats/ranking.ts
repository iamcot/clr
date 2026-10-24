export type RankingMetric = 'month' | 'year' | 'level'

export type RankingRow = {
  memberId: string
  displayName: string | null
  avatarUrl: string | null
  memberType: string | null
  gender: string | null
  level: number
  clubPoints: number
  monthDistanceMeters: number
  yearDistanceMeters: number
}

export type RankingFilter = { gender: string | null; memberType: string | null }

export type RankedRow = RankingRow & { rank: number; value: number }

export type RankingPage = {
  rows: RankedRow[]
  ownRow: RankedRow | null
  hasMore: boolean
  total: number
}

function valueOf(row: RankingRow, metric: RankingMetric): number {
  if (metric === 'month') return row.monthDistanceMeters
  if (metric === 'year') return row.yearDistanceMeters
  return row.clubPoints
}

function matchesFilter(row: RankingRow, filter: RankingFilter): boolean {
  if (filter.gender && row.gender !== filter.gender) return false
  if (filter.memberType && row.memberType !== filter.memberType) return false
  return true
}

// Cùng giá trị thì cùng hạng (1, 2, 2, 4); tab level xếp theo level trước rồi tới điểm CLB
function sortRows(rows: RankingRow[], metric: RankingMetric): RankingRow[] {
  return [...rows].sort((a, b) => {
    if (metric === 'level' && a.level !== b.level) return b.level - a.level
    const difference = valueOf(b, metric) - valueOf(a, metric)
    if (difference !== 0) return difference
    return (a.displayName ?? '').localeCompare(b.displayName ?? '', 'vi')
  })
}

function sameRank(a: RankingRow, b: RankingRow, metric: RankingMetric): boolean {
  return valueOf(a, metric) === valueOf(b, metric) && (metric !== 'level' || a.level === b.level)
}

function assignRanks(sorted: RankingRow[], metric: RankingMetric): RankedRow[] {
  const ranked: RankedRow[] = []
  sorted.forEach((row, index) => {
    const previous = sorted[index - 1]
    const previousRanked = ranked[index - 1]
    const rank = previous && previousRanked && sameRank(previous, row, metric) ? previousRanked.rank : index + 1
    ranked.push({ ...row, rank, value: valueOf(row, metric) })
  })
  return ranked
}

export function buildRankingPage(
  rows: RankingRow[],
  metric: RankingMetric,
  filter: RankingFilter,
  viewerId: string,
  page: number,
  pageSize: number,
): RankingPage {
  const ranked = assignRanks(sortRows(rows.filter((row) => matchesFilter(row, filter)), metric), metric)
  const visibleCount = Math.max(1, page) * pageSize
  const visible = ranked.slice(0, visibleCount)
  const ownRow = ranked.find((row) => row.memberId === viewerId) ?? null
  return {
    rows: visible,
    ownRow: ownRow && !visible.includes(ownRow) ? ownRow : null,
    hasMore: ranked.length > visibleCount,
    total: ranked.length,
  }
}
