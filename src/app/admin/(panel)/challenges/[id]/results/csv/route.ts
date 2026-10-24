import { getBcnMember } from '@/lib/auth/requireBcn'
import { logAudit } from '@/lib/audit/logAudit'
import { formatProgressValue } from '@/lib/challenges/describe'
import { loadChallenge, loadEntries } from '@/lib/challenges/loadChallenges'
import type { GoalType } from '@/config/challenges'
import { csvResponse, toCsv } from '@/lib/format/csv'

const HEADERS = [
  'Hạng',
  'Tên',
  'Hạng mục',
  'Kết quả',
  'Tiến độ (%)',
  'Hoàn thành',
  'Bị loại',
  'Lý do loại',
  'Miễn phạt',
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getBcnMember())) return new Response('Not found', { status: 404 })
  const { id } = await params
  const data = await loadChallenge(id)
  if (!data) return new Response('Not found', { status: 404 })

  const goalType = data.challenge.goal_type as GoalType
  const categoryName = new Map(data.categories.map((category) => [category.id, category.name]))
  const entries = await loadEntries(id)
  const rows = entries.map((entry) => [
    entry.rank,
    entry.displayName,
    categoryName.get(entry.category_id) ?? '',
    formatProgressValue(goalType, Number(entry.value)),
    Math.round(Number(entry.progress_pct)),
    entry.completed ? 'Có' : 'Không',
    entry.excluded ? 'Có' : 'Không',
    entry.excluded_reason,
    entry.penalty_waived ? 'Có' : 'Không',
  ])
  await logAudit({
    action: 'export_challenge_results',
    targetTable: 'challenges',
    targetId: id,
    after: { count: rows.length },
  })
  return csvResponse(toCsv(HEADERS, rows), `clr-challenge-${id}.csv`)
}
