import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge, { type BadgeTone } from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { adminButtonClass } from '@/components/admin/styles'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { STATUS_LABELS, type ChallengeStatus } from '@/config/challenges'
import { createFromTemplate } from '@/lib/challenges/adminActions'
import { loadChallenges, loadTemplateChallengeId, type ChallengeRow } from '@/lib/challenges/loadChallenges'
import { formatDateVi } from '@/lib/format/dateTime'

const STATUS_ORDER: ChallengeStatus[] = ['running', 'finalizing', 'published', 'draft', 'closed']

const STATUS_TONES: Record<ChallengeStatus, BadgeTone> = {
  running: 'success',
  finalizing: 'warning',
  published: 'info',
  draft: 'neutral',
  closed: 'neutral',
}

function sortByStatus(challenges: ChallengeRow[]): ChallengeRow[] {
  return STATUS_ORDER.flatMap((status) => challenges.filter((challenge) => challenge.status === status))
}

function challengeColumns(templateId: string | null): DataTableColumn<ChallengeRow>[] {
  return [
    {
      key: 'title',
      header: 'Challenge',
      isLink: true,
      cell: (challenge) => (
        <span>
          {challenge.title}
          {challenge.id === templateId && <span className="ml-2 text-xs font-normal text-brand-dark">Mẫu</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (challenge) => (
        <Badge tone={STATUS_TONES[challenge.status as ChallengeStatus]}>
          {STATUS_LABELS[challenge.status as ChallengeStatus]}
        </Badge>
      ),
    },
    { key: 'start', header: 'Bắt đầu', hideBelowMd: true, cell: (challenge) => formatDateVi(challenge.starts_at) },
    { key: 'end', header: 'Kết thúc', cell: (challenge) => formatDateVi(challenge.ends_at) },
  ]
}

export default async function AdminChallengesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const [challenges, templateId] = await Promise.all([loadChallenges(), loadTemplateChallengeId()])
  const { rows, window } = slicePage(sortByStatus(challenges), parsePage(params.page))

  return (
    <section>
      <AdminPageHeader
        title="Challenge"
        description="Tạo và theo dõi challenge của CLB"
        actions={
          <>
            <Link href="/admin/challenges/summary" className={adminButtonClass('secondary')}>
              Tổng hợp nhiều kỳ
            </Link>
            {templateId && (
              <ActionForm action={createFromTemplate}>
                <button type="submit" className={adminButtonClass('secondary')}>
                  Tạo từ mẫu (tháng sau)
                </button>
              </ActionForm>
            )}
            <Link href="/admin/challenges/new" className={adminButtonClass('primary')}>
              + Tạo challenge
            </Link>
          </>
        }
      />
      <DataTable
        columns={challengeColumns(templateId)}
        rows={rows}
        rowKey={(challenge) => challenge.id}
        rowHref={(challenge) => `/admin/challenges/${challenge.id}`}
        emptyText="Chưa có challenge nào."
      />
      <Pagination window={window} hrefFor={(page) => hrefWithPage('/admin/challenges', params, page)} unit="challenge" />
    </section>
  )
}
