import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import { PENALTY_TYPES } from '@/config/penalties'
import { STATUS_LABELS, type ChallengeStatus, type GoalType } from '@/config/challenges'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { closeChallengeAction } from '@/lib/challenges/adminActions'
import { formatProgressValue } from '@/lib/challenges/describe'
import { loadChallenge, loadEntries, type EntryWithMember } from '@/lib/challenges/loadChallenges'
import { previewSettlement } from '@/lib/challenges/settlement'
import { formatVndCompact } from '@/lib/format/money'

const PENALTY_NAMES = Object.fromEntries(PENALTY_TYPES.map((type) => [type.code, type.name]))

type PreviewRow = { key: string; kind: 'penalty' | 'reward'; name: string; detail: string; amount: number }

const PREVIEW_COLUMNS: DataTableColumn<PreviewRow>[] = [
  { key: 'name', header: 'Thành viên', cell: (row) => <b>{row.name}</b> },
  {
    key: 'kind',
    header: 'Loại',
    cell: (row) => <Badge tone={row.kind === 'penalty' ? 'danger' : 'success'}>{row.kind === 'penalty' ? 'Phạt' : 'Thưởng'}</Badge>,
  },
  { key: 'detail', header: 'Nội dung', hideBelowMd: true, cell: (row) => row.detail },
  { key: 'amount', header: 'Số tiền', align: 'right', cell: (row) => (row.amount ? formatVndCompact(row.amount) : '—') },
]

function entryColumns(categoryName: Map<string, string>, goalType: GoalType): DataTableColumn<EntryWithMember>[] {
  return [
    { key: 'rank', header: '#', cell: (entry) => entry.rank ?? '—' },
    {
      key: 'member',
      header: 'Thành viên',
      cell: (entry) => (
        <b>
          {entry.displayName}
          {entry.completed && <span className="ml-1 text-brand-dark">✓</span>}
        </b>
      ),
    },
    { key: 'category', header: 'Hạng mục', hideBelowMd: true, cell: (entry) => categoryName.get(entry.category_id) ?? '—' },
    {
      key: 'progress',
      header: 'Tiến độ',
      align: 'right',
      cell: (entry) => `${formatProgressValue(goalType, Number(entry.value))} · ${Math.round(Number(entry.progress_pct))}%`,
    },
    {
      key: 'status',
      header: 'Ghi chú',
      hideBelowMd: true,
      cell: (entry) => entry.excluded && <Badge tone="danger">Bị loại{entry.excluded_reason ? `: ${entry.excluded_reason}` : ''}</Badge>,
    },
  ]
}

export default async function ChallengeResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const data = await loadChallenge(id)
  if (!data || data.challenge.status === 'draft') notFound()
  const { challenge, categories } = data
  const goalType = challenge.goal_type as GoalType
  const status = challenge.status as ChallengeStatus
  const [entries, preview] = await Promise.all([loadEntries(id), previewSettlement(id)])
  const categoryName = new Map(categories.map((category) => [category.id, category.name]))
  const ended = new Date(challenge.ends_at).getTime() <= new Date().getTime()
  const canClose = status !== 'closed' && status !== 'published' && ended
  const paged = slicePage(entries, parsePage(query.page))
  const previewRows: PreviewRow[] = preview
    ? [
        ...preview.plan.penalties.map((penalty) => ({
          key: `p-${penalty.memberId}-${penalty.typeCode}`,
          kind: 'penalty' as const,
          name: preview.names[penalty.memberId] ?? 'Thành viên',
          detail: `${PENALTY_NAMES[penalty.typeCode] ?? penalty.typeCode}: ${penalty.reason}`,
          amount: penalty.amount,
        })),
        ...preview.plan.rewards.map((reward) => ({
          key: `r-${reward.memberId}-${reward.title}`,
          kind: 'reward' as const,
          name: preview.names[reward.memberId] ?? 'Thành viên',
          detail: `${reward.title}: ${reward.reason}`,
          amount: reward.amount ?? 0,
        })),
      ]
    : []

  return (
    <section>
      <AdminPageHeader
        title="Kết quả và chốt"
        backHref={`/admin/challenges/${id}`}
        backLabel={challenge.title}
        description={STATUS_LABELS[status]}
        actions={
          <>
            <Link href={`/admin/challenges/${id}/results/csv`} prefetch={false} className={adminButtonClass('secondary')}>
              Xuất CSV
            </Link>
            {canClose && (
              <ActionForm action={closeChallengeAction}>
                <input type="hidden" name="challenge_id" value={id} />
                <button type="submit" className={adminButtonClass('primary')}>
                  Chốt kết quả
                </button>
              </ActionForm>
            )}
          </>
        }
      />

      {preview && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Khoản phạt" value={preview.plan.penalties.length} />
          <StatCard label="Tổng tiền phạt" value={formatVndCompact(preview.totalPenaltyAmount)} />
          <StatCard label="Khoản thưởng" value={preview.plan.rewards.length} />
        </div>
      )}

      <AdminCard title="Bản xem trước thưởng phạt" className="mt-4">
        <DataTable columns={PREVIEW_COLUMNS} rows={previewRows} rowKey={(row) => row.key} emptyText="Không có khoản nào." />
        <p className="mt-3 text-xs text-muted">
          Người bị loại hoặc đã được miễn phạt (ở trang challenge) không có khoản phạt. Chốt lần nữa không nhân đôi khoản.
          {!canClose && status !== 'closed' && ' Chưa tới hạn chốt.'}
        </p>
      </AdminCard>

      <h2 className="mt-6 mb-2 text-lg font-black">Bảng kết quả</h2>
      <DataTable
        columns={entryColumns(categoryName, goalType)}
        rows={paged.rows}
        rowKey={(entry) => entry.member_id}
        emptyText="Chưa có ai tham gia."
      />
      <Pagination
        window={paged.window}
        hrefFor={(page) => hrefWithPage(`/admin/challenges/${id}/results`, query, page)}
        unit="người"
      />
    </section>
  )
}
