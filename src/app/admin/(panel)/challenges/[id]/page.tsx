import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge, { type BadgeTone } from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import {
  GOAL_TYPE_LABELS,
  PARTICIPATION_LABELS,
  STATUS_LABELS,
  type ChallengeStatus,
  type GoalType,
  type ParticipationMode,
} from '@/config/challenges'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import {
  addEntry,
  cloneChallenge,
  publishChallenge,
  recomputeChallengeAction,
  setAsTemplate,
  setEntryCategory,
  setEntryExcluded,
  setEntryWaived,
} from '@/lib/challenges/adminActions'
import { describeGoal, formatProgressValue } from '@/lib/challenges/describe'
import { describeActivityFilter } from '@/lib/challenges/filter'
import { loadChallenge, loadEntries, type CategoryRow, type EntryWithMember } from '@/lib/challenges/loadChallenges'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const MEMBER_PICKER_LIMIT = 800
const TABS = ['entries', 'info', 'add'] as const

const STATUS_TONES: Record<ChallengeStatus, BadgeTone> = {
  running: 'success',
  finalizing: 'warning',
  published: 'info',
  draft: 'neutral',
  closed: 'neutral',
}

function HeaderActions({ challengeId, status }: { challengeId: string; status: string }) {
  const hidden = <input type="hidden" name="challenge_id" value={challengeId} />
  const live = status !== 'draft' && status !== 'closed'
  return (
    <>
      <Link href={`/admin/challenges/${challengeId}/edit`} className={adminButtonClass('secondary')}>
        Sửa
      </Link>
      {live && (
        <ActionForm action={recomputeChallengeAction}>
          {hidden}
          <button type="submit" className={adminButtonClass('secondary')}>
            Tính lại tất cả
          </button>
        </ActionForm>
      )}
      {status === 'draft' && (
        <ActionForm action={publishChallenge}>
          {hidden}
          <button type="submit" className={adminButtonClass('primary')}>
            Công bố
          </button>
        </ActionForm>
      )}
      {status !== 'draft' && (
        <Link href={`/admin/challenges/${challengeId}/results`} className={adminButtonClass('primary')}>
          Kết quả và chốt
        </Link>
      )}
    </>
  )
}

function TemplateActions({ challengeId }: { challengeId: string }) {
  const hidden = <input type="hidden" name="challenge_id" value={challengeId} />
  return (
    <AdminCard title="Sao chép" className="mt-4">
      <div className="flex flex-wrap gap-2">
        <ActionForm action={cloneChallenge}>
          {hidden}
          <button type="submit" className={adminButtonClass('secondary')}>
            Nhân bản sang tháng sau
          </button>
        </ActionForm>
        <ActionForm action={setAsTemplate}>
          {hidden}
          <button type="submit" className={adminButtonClass('secondary')}>
            Đặt làm challenge mẫu
          </button>
        </ActionForm>
      </div>
    </AdminCard>
  )
}

function EntryManage({
  entry,
  challengeId,
  categories,
}: {
  entry: EntryWithMember
  challengeId: string
  categories: CategoryRow[]
}) {
  const hidden = (
    <>
      <input type="hidden" name="challenge_id" value={challengeId} />
      <input type="hidden" name="member_id" value={entry.member_id} />
    </>
  )
  return (
    <details className="min-w-52">
      <summary className="flex min-h-8 cursor-pointer items-center text-sm font-bold text-brand-dark">Quản lý</summary>
      <div className="flex flex-col gap-2 py-2">
        <ActionForm action={setEntryExcluded} className="flex flex-col gap-2">
          {hidden}
          <input type="hidden" name="excluded" value={entry.excluded ? 'false' : 'true'} />
          {!entry.excluded && <input name="reason" placeholder="Lý do loại" required className={ADMIN_INPUT_CLASS} />}
          <button type="submit" className={adminButtonClass(entry.excluded ? 'secondary' : 'danger')}>
            {entry.excluded ? 'Đưa trở lại' : 'Loại khỏi challenge'}
          </button>
        </ActionForm>
        <ActionForm action={setEntryWaived} className="flex flex-col gap-2">
          {hidden}
          <input type="hidden" name="waived" value={entry.penalty_waived ? 'false' : 'true'} />
          {!entry.penalty_waived && (
            <input name="reason" placeholder="Lý do miễn phạt (ốm, chấn thương...)" required className={ADMIN_INPUT_CLASS} />
          )}
          <button type="submit" className={adminButtonClass('secondary')}>
            {entry.penalty_waived ? 'Bỏ miễn phạt' : 'Miễn phạt'}
          </button>
        </ActionForm>
        {categories.length > 1 && (
          <ActionForm action={setEntryCategory} className="flex gap-2">
            {hidden}
            <select name="category_id" defaultValue={entry.category_id} className={ADMIN_INPUT_CLASS}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button type="submit" className={adminButtonClass('secondary')}>
              Chuyển
            </button>
          </ActionForm>
        )}
      </div>
    </details>
  )
}

function entryColumns(challengeId: string, categories: CategoryRow[], goalType: GoalType): DataTableColumn<EntryWithMember>[] {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  return [
    { key: 'rank', header: '#', cell: (entry) => entry.rank ?? '—' },
    {
      key: 'member',
      header: 'Thành viên',
      cell: (entry) => (
        <span className="font-bold">
          {entry.displayName}
          {entry.completed && <span className="ml-1 text-brand-dark">✓</span>}
        </span>
      ),
    },
    { key: 'category', header: 'Hạng mục', hideBelowMd: true, cell: (entry) => categoryNames.get(entry.category_id) ?? '—' },
    {
      key: 'progress',
      header: 'Tiến độ',
      align: 'right',
      cell: (entry) => `${formatProgressValue(goalType, Number(entry.value))} · ${Math.round(Number(entry.progress_pct))}%`,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      hideBelowMd: true,
      cell: (entry) => (
        <span className="flex flex-wrap gap-1">
          {entry.excluded && <Badge tone="danger">Bị loại{entry.excluded_reason ? `: ${entry.excluded_reason}` : ''}</Badge>}
          {entry.penalty_waived && <Badge tone="info">Miễn phạt</Badge>}
        </span>
      ),
    },
    {
      key: 'manage',
      header: '',
      cell: (entry) => <EntryManage entry={entry} challengeId={challengeId} categories={categories} />,
    },
  ]
}

async function loadAddableMembers(takenIds: Set<string>) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('members')
    .select('id, display_name')
    .eq('status', 'active')
    .order('display_name')
    .range(0, MEMBER_PICKER_LIMIT - 1)
  return (data ?? []).filter((member) => !takenIds.has(member.id))
}

export default async function AdminChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const data = await loadChallenge(id)
  if (!data) notFound()
  const { challenge, categories, filter } = data
  const goalType = challenge.goal_type as GoalType
  const status = challenge.status as ChallengeStatus
  const canAdd = status !== 'draft' && status !== 'closed'
  const tab = pickTab(TABS, query.tab, 'entries')
  const [allEntries, entries] = await Promise.all([loadEntries(id), loadEntries(id, query.q)])
  const addable = tab === 'add' ? await loadAddableMembers(new Set(allEntries.map((entry) => entry.member_id))) : []
  const paged = slicePage(entries, parsePage(query.page))
  const basePath = `/admin/challenges/${id}`

  const tabItems = [
    { href: basePath, label: `Người tham gia (${allEntries.length})`, active: tab === 'entries' },
    { href: `${basePath}?tab=info`, label: 'Thông tin', active: tab === 'info' },
    ...(canAdd ? [{ href: `${basePath}?tab=add`, label: 'Thêm người', active: tab === 'add' }] : []),
  ]

  return (
    <section>
      <AdminPageHeader
        title={challenge.title}
        backHref="/admin/challenges"
        backLabel="Challenge"
        description={`${GOAL_TYPE_LABELS[goalType]} · ${PARTICIPATION_LABELS[challenge.participation as ParticipationMode]} · ${formatDateTimeVi(challenge.starts_at)} đến ${formatDateTimeVi(challenge.ends_at)}`}
        actions={<HeaderActions challengeId={id} status={challenge.status} />}
      />
      <div className="mb-4">
        <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
      </div>
      <AdminTabs items={tabItems} />

      {tab === 'entries' && (
        <div className="mt-4">
          <form method="get" className="mb-3 flex gap-2">
            <input name="q" defaultValue={query.q ?? ''} placeholder="Tìm theo tên" className={ADMIN_INPUT_CLASS} />
            <button type="submit" className={adminButtonClass('secondary')}>
              Tìm
            </button>
          </form>
          <DataTable
            columns={entryColumns(id, categories, goalType)}
            rows={paged.rows}
            rowKey={(entry) => entry.member_id}
            emptyText="Chưa có ai tham gia."
          />
          <Pagination window={paged.window} hrefFor={(page) => hrefWithPage(basePath, query, page)} unit="người" />
        </div>
      )}

      {tab === 'info' && (
        <div className="mt-4 flex flex-col gap-4">
          <AdminCard title="Mục tiêu và điều kiện">
            <ul className="list-disc pl-5 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  {category.name}: {describeGoal(goalType, Number(category.goal_value))}
                </li>
              ))}
              {describeActivityFilter(filter).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </AdminCard>
          <TemplateActions challengeId={id} />
        </div>
      )}

      {tab === 'add' && canAdd && (
        <AdminCard title="Thêm người vào challenge" className="mt-4">
          <ActionForm action={addEntry} className="grid gap-2 md:grid-cols-3">
            <input type="hidden" name="challenge_id" value={id} />
            <select name="member_id" className={ADMIN_INPUT_CLASS} defaultValue="">
              <option value="" disabled>
                Chọn thành viên
              </option>
              {addable.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name ?? 'Thành viên'}
                </option>
              ))}
            </select>
            <select name="category_id" className={ADMIN_INPUT_CLASS} defaultValue={categories[0]?.id}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button type="submit" className={adminButtonClass('primary')}>
              Thêm
            </button>
          </ActionForm>
        </AdminCard>
      )}
    </section>
  )
}
