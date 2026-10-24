import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import {
  GOAL_TYPE_LABELS,
  PARTICIPATION_LABELS,
  STATUS_LABELS,
  type GoalType,
  type ParticipationMode,
} from '@/config/challenges'
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

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const BUTTON_CLASS = 'min-h-11 rounded-lg border border-line bg-white px-4 font-bold'
const ENTRY_LIST_LIMIT = 100
const MEMBER_PICKER_LIMIT = 800

function ChallengeActions({ challengeId, status }: { challengeId: string; status: string }) {
  const hidden = <input type="hidden" name="challenge_id" value={challengeId} />
  return (
    <div className="mt-4 flex flex-col gap-2">
      <Link
        href={`/admin/challenges/${challengeId}/edit`}
        className={`${BUTTON_CLASS} flex items-center justify-center`}
      >
        Sửa
      </Link>
      {status === 'draft' && (
        <ActionForm action={publishChallenge}>
          {hidden}
          <button
            type="submit"
            className="min-h-12 w-full rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
          >
            Công bố
          </button>
        </ActionForm>
      )}
      {status !== 'draft' && status !== 'closed' && (
        <ActionForm action={recomputeChallengeAction}>
          {hidden}
          <button type="submit" className={`${BUTTON_CLASS} w-full`}>
            Tính lại tất cả
          </button>
        </ActionForm>
      )}
      <ActionForm action={cloneChallenge}>
        {hidden}
        <button type="submit" className={`${BUTTON_CLASS} w-full`}>
          Nhân bản sang tháng sau
        </button>
      </ActionForm>
      <ActionForm action={setAsTemplate}>
        {hidden}
        <button type="submit" className={`${BUTTON_CLASS} w-full`}>
          Đặt làm challenge mẫu
        </button>
      </ActionForm>
      {status !== 'draft' && (
        <Link
          href={`/admin/challenges/${challengeId}/results`}
          className={`${BUTTON_CLASS} flex items-center justify-center`}
        >
          Kết quả và chốt
        </Link>
      )}
    </div>
  )
}

function EntryRow({
  entry,
  challengeId,
  categories,
  goalType,
}: {
  entry: EntryWithMember
  challengeId: string
  categories: CategoryRow[]
  goalType: GoalType
}) {
  const hidden = (
    <>
      <input type="hidden" name="challenge_id" value={challengeId} />
      <input type="hidden" name="member_id" value={entry.member_id} />
    </>
  )
  return (
    <li className={`rounded-lg p-3 ${entry.excluded ? 'bg-line' : 'bg-white'}`}>
      <p className="font-bold">
        {entry.rank ? `#${entry.rank} ` : ''}
        {entry.displayName}
        {entry.completed && <span className="ml-2 text-brand-dark">✓</span>}
      </p>
      <p className="text-sm text-muted">
        {formatProgressValue(goalType, Number(entry.value))} · {Math.round(Number(entry.progress_pct))}%
        {entry.excluded && ` · Bị loại: ${entry.excluded_reason ?? ''}`}
        {entry.penalty_waived && ` · Miễn phạt: ${entry.waived_reason ?? ''}`}
      </p>
      <details className="mt-1">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-brand-dark">
          Quản lý
        </summary>
        <div className="flex flex-col gap-2 pb-2">
          <ActionForm action={setEntryExcluded} className="flex flex-col gap-2">
            {hidden}
            <input type="hidden" name="excluded" value={entry.excluded ? 'false' : 'true'} />
            {!entry.excluded && <input name="reason" placeholder="Lý do loại" required className={INPUT_CLASS} />}
            <button type="submit" className={BUTTON_CLASS}>
              {entry.excluded ? 'Đưa trở lại' : 'Loại khỏi challenge'}
            </button>
          </ActionForm>
          <ActionForm action={setEntryWaived} className="flex flex-col gap-2">
            {hidden}
            <input type="hidden" name="waived" value={entry.penalty_waived ? 'false' : 'true'} />
            {!entry.penalty_waived && (
              <input
                name="reason"
                placeholder="Lý do miễn phạt (ốm, chấn thương...)"
                required
                className={INPUT_CLASS}
              />
            )}
            <button type="submit" className={BUTTON_CLASS}>
              {entry.penalty_waived ? 'Bỏ miễn phạt' : 'Miễn phạt'}
            </button>
          </ActionForm>
          {categories.length > 1 && (
            <ActionForm action={setEntryCategory} className="flex gap-2">
              {hidden}
              <select name="category_id" defaultValue={entry.category_id} className={INPUT_CLASS}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={BUTTON_CLASS}>
                Chuyển
              </button>
            </ActionForm>
          )}
        </div>
      </details>
    </li>
  )
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
  searchParams: Promise<{ q?: string }>
}) {
  const { id } = await params
  const { q } = await searchParams
  const data = await loadChallenge(id)
  if (!data) notFound()
  const { challenge, categories, filter } = data
  const goalType = challenge.goal_type as GoalType
  const [allEntries, entries] = await Promise.all([loadEntries(id), loadEntries(id, q)])
  const addable = await loadAddableMembers(new Set(allEntries.map((entry) => entry.member_id)))

  return (
    <section>
      <Link href="/admin/challenges" className="text-sm text-muted underline">
        ← Challenge
      </Link>
      <h1 className="mt-2 text-2xl font-black">{challenge.title}</h1>
      <p className="text-sm text-muted">
        {STATUS_LABELS[challenge.status as keyof typeof STATUS_LABELS]} · {GOAL_TYPE_LABELS[goalType]} ·{' '}
        {PARTICIPATION_LABELS[challenge.participation as ParticipationMode]}
      </p>
      <p className="text-sm text-muted">
        {formatDateTimeVi(challenge.starts_at)} đến {formatDateTimeVi(challenge.ends_at)}
      </p>
      <ul className="mt-3 list-disc pl-5 text-sm">
        {categories.map((category) => (
          <li key={category.id}>
            {category.name}: {describeGoal(goalType, Number(category.goal_value))}
          </li>
        ))}
        {describeActivityFilter(filter).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <ChallengeActions challengeId={id} status={challenge.status} />

      <h2 className="mt-8 text-lg font-black">Người tham gia ({allEntries.length})</h2>
      <form method="get" className="mt-2 flex gap-2">
        <input name="q" defaultValue={q ?? ''} placeholder="Tìm theo tên" className={INPUT_CLASS} />
        <button type="submit" className={BUTTON_CLASS}>
          Tìm
        </button>
      </form>
      <ul className="mt-3 flex flex-col gap-2">
        {entries.slice(0, ENTRY_LIST_LIMIT).map((entry) => (
          <EntryRow key={entry.member_id} entry={entry} challengeId={id} categories={categories} goalType={goalType} />
        ))}
      </ul>
      {entries.length > ENTRY_LIST_LIMIT && (
        <p className="mt-2 text-sm text-muted">Chỉ hiện {ENTRY_LIST_LIMIT} người đầu, hãy tìm theo tên.</p>
      )}

      {challenge.status !== 'draft' && challenge.status !== 'closed' && (
        <ActionForm action={addEntry} className="mt-6 flex flex-col gap-2 rounded-xl bg-white p-4">
          <h3 className="font-black">Thêm người vào challenge</h3>
          <input type="hidden" name="challenge_id" value={id} />
          <select name="member_id" className={INPUT_CLASS} defaultValue="">
            <option value="" disabled>
              Chọn thành viên
            </option>
            {addable.map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name ?? 'Thành viên'}
              </option>
            ))}
          </select>
          <select name="category_id" className={INPUT_CLASS} defaultValue={categories[0]?.id}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="submit" className={BUTTON_CLASS}>
            Thêm
          </button>
        </ActionForm>
      )}
    </section>
  )
}
