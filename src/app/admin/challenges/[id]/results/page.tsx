import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import { PENALTY_TYPES } from '@/config/penalties'
import { STATUS_LABELS, type ChallengeStatus, type GoalType } from '@/config/challenges'
import { closeChallengeAction } from '@/lib/challenges/adminActions'
import { formatProgressValue } from '@/lib/challenges/describe'
import { loadChallenge, loadEntries } from '@/lib/challenges/loadChallenges'
import { previewSettlement } from '@/lib/challenges/settlement'
import { formatVnd } from '@/lib/format/money'

const PENALTY_NAMES = Object.fromEntries(PENALTY_TYPES.map((type) => [type.code, type.name]))

export default async function ChallengeResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadChallenge(id)
  if (!data || data.challenge.status === 'draft') notFound()
  const { challenge, categories } = data
  const goalType = challenge.goal_type as GoalType
  const status = challenge.status as ChallengeStatus
  const [entries, preview] = await Promise.all([loadEntries(id), previewSettlement(id)])
  const categoryName = new Map(categories.map((category) => [category.id, category.name]))
  const ended = new Date(challenge.ends_at).getTime() <= new Date().getTime()
  const canClose = status !== 'closed' && status !== 'published' && ended

  return (
    <section>
      <Link href={`/admin/challenges/${id}`} className="text-sm text-muted underline">
        ← {challenge.title}
      </Link>
      <h1 className="mt-2 text-2xl font-black">Kết quả và chốt</h1>
      <p className="text-sm text-muted">{STATUS_LABELS[status]}</p>
      <Link
        href={`/admin/challenges/${id}/results/csv`}
        prefetch={false}
        className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-line bg-white font-bold"
      >
        Xuất CSV
      </Link>

      <h2 className="mt-6 text-lg font-black">Bản xem trước thưởng phạt</h2>
      {preview && (
        <>
          <p className="text-sm text-muted">
            {preview.plan.penalties.length} khoản phạt, tổng {formatVnd(preview.totalPenaltyAmount)}.{' '}
            {preview.plan.rewards.length} khoản thưởng.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {preview.plan.penalties.map((penalty) => (
              <li key={`${penalty.memberId}-${penalty.typeCode}`} className="rounded-lg bg-white p-2">
                <b>{preview.names[penalty.memberId]}</b>: phạt {formatVnd(penalty.amount)} (
                {PENALTY_NAMES[penalty.typeCode] ?? penalty.typeCode}, {penalty.reason})
              </li>
            ))}
            {preview.plan.rewards.map((reward) => (
              <li key={`${reward.memberId}-${reward.title}`} className="rounded-lg bg-lime/30 p-2">
                <b>{preview.names[reward.memberId]}</b>: thưởng {reward.title}
                {reward.amount ? ` ${formatVnd(reward.amount)}` : ''} ({reward.reason})
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-2 text-xs text-muted">
        Người bị loại hoặc đã được miễn phạt (ở trang challenge) không có khoản phạt. Chốt lần nữa không nhân đôi khoản.
      </p>
      {canClose && (
        <ActionForm action={closeChallengeAction} className="mt-3">
          <input type="hidden" name="challenge_id" value={id} />
          <button
            type="submit"
            className="min-h-12 w-full rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
          >
            Chốt kết quả
          </button>
        </ActionForm>
      )}
      {!canClose && status !== 'closed' && <p className="mt-3 text-sm text-muted">Chưa tới hạn chốt.</p>}

      <h2 className="mt-6 text-lg font-black">Bảng kết quả</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.member_id} className={`rounded-lg p-3 ${entry.excluded ? 'bg-line' : 'bg-white'}`}>
            <p className="font-bold">
              {entry.rank ? `#${entry.rank} ` : ''}
              {entry.displayName}
              {entry.completed && <span className="ml-2 text-brand-dark">✓</span>}
            </p>
            <p className="text-sm text-muted">
              {categoryName.get(entry.category_id)} · {formatProgressValue(goalType, Number(entry.value))} ·{' '}
              {Math.round(Number(entry.progress_pct))}%{entry.excluded && ` · Bị loại: ${entry.excluded_reason ?? ''}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
