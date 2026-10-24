import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import LiveChallengeRanking, { type LiveRankingRow } from '@/components/LiveChallengeRanking'
import { KM_GOAL_TYPES, type ChallengeStatus, type GoalType } from '@/config/challenges'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { describeGoal, formatProgressValue } from '@/lib/challenges/describe'
import { describeActivityFilter } from '@/lib/challenges/filter'
import { loadChallenge } from '@/lib/challenges/loadChallenges'
import { explainMyActivities, loadMyEntry, loadRankingRows } from '@/lib/challenges/loadMemberView'
import { joinChallenge } from '@/lib/challenges/memberActions'
import { canRegister, challengePhase, summarizeProgress } from '@/lib/challenges/status'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatKm } from '@/lib/stats/format'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function loadFollowingIds(memberId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', memberId)
  return (data ?? []).map((row) => row.followee_id)
}

function countedValueText(goalType: GoalType, value: number): string {
  if (KM_GOAL_TYPES.includes(goalType)) return formatKm(value)
  return formatProgressValue(goalType, value)
}

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await requireActiveMember()
  const data = await loadChallenge(id)
  if (!data || data.challenge.status === 'draft') notFound()
  const { challenge, categories, filter } = data
  const goalType = challenge.goal_type as GoalType
  const status = challenge.status as ChallengeStatus
  const now = new Date()
  const phase = challengePhase(status, challenge.starts_at, challenge.ends_at, now)

  const [mine, ranking, followingIds] = await Promise.all([
    loadMyEntry(id, member.id),
    loadRankingRows(id),
    loadFollowingIds(member.id),
  ])
  const myCategory = categories.find((category) => category.id === mine?.categoryId)
  const myGoal = myCategory ? Number(myCategory.goal_value) : null
  const explained = mine && myGoal ? await explainMyActivities(challenge, myGoal, member.id) : null
  const summary =
    mine && myGoal
      ? summarizeProgress(
          myGoal,
          mine.value,
          challenge.ends_at,
          now,
          goalType === 'total_distance' || goalType === 'total_elevation',
        )
      : null
  const showJoin =
    !mine && canRegister(challenge.participation, status, challenge.ends_at, challenge.registration_closes_at, now)

  const rows: LiveRankingRow[] = ranking.rows.map((row) => ({
    memberId: row.memberId,
    name: ranking.names[row.memberId] ?? 'Thành viên',
    categoryId: row.categoryId,
    valueText: formatProgressValue(goalType, row.value),
    progressPct: row.progressPct,
    completed: row.completed,
    rank: row.rank,
  }))

  return (
    <section>
      <Link href="/challenges" className="text-sm text-muted underline">
        ← Challenge
      </Link>
      <h1 className="mt-2 text-2xl font-black">{challenge.title}</h1>
      <p className="text-sm text-muted">
        {formatDateTimeVi(challenge.starts_at)} đến {formatDateTimeVi(challenge.ends_at)}
      </p>
      {challenge.description && <p className="mt-2 whitespace-pre-line">{challenge.description}</p>}

      <h2 className="mt-5 text-lg font-black">Luật</h2>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {categories.map((category) => (
          <li key={category.id}>
            {category.name}: {describeGoal(goalType, Number(category.goal_value))}
          </li>
        ))}
        {describeActivityFilter(filter).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {showJoin && (
        <ActionForm action={joinChallenge} className="mt-4">
          <input type="hidden" name="challenge_id" value={id} />
          <button
            type="submit"
            className="min-h-12 w-full rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
          >
            Tham gia
          </button>
        </ActionForm>
      )}
      {!mine && !showJoin && phase !== 'ended' && (
        <p className="mt-4 rounded-lg bg-white p-3 text-sm text-muted">Bạn không nằm trong challenge này.</p>
      )}

      {mine && myGoal && summary && (
        <>
          <h2 className="mt-5 text-lg font-black">Tiến độ của bạn</h2>
          <div className="mt-2 rounded-lg bg-white p-3">
            <p className="text-2xl font-black">
              {formatProgressValue(goalType, mine.value)}
              <span className="text-base font-normal text-muted"> / {formatProgressValue(goalType, myGoal)}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-brand" style={{ width: `${Math.min(100, mine.progressPct)}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {mine.completed
                ? 'Bạn đã hoàn thành challenge này.'
                : `${Math.round(mine.progressPct)}%, còn thiếu ${formatProgressValue(goalType, summary.remaining)}`}
              {phase === 'running' && ` · còn ${summary.daysLeft} ngày`}
              {phase === 'running' &&
                !mine.completed &&
                summary.neededPerDay != null &&
                ` · cần trung bình ${formatProgressValue(goalType, summary.neededPerDay)}/ngày`}
            </p>
            {mine.excluded && <p className="mt-2 text-sm text-danger">Bạn bị loại: {mine.excludedReason}</p>}
          </div>
        </>
      )}

      {explained && (
        <>
          <h2 className="mt-5 text-lg font-black">Buổi chạy của bạn</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {explained.counted.map(({ activity, name, countedValue }) => (
              <li key={activity.id} className="rounded-lg bg-white p-3 text-sm">
                <p className="font-bold">{name}</p>
                <p className="text-muted">
                  {formatDateTimeVi(activity.startDate)} · tính {countedValueText(goalType, countedValue)}
                </p>
              </li>
            ))}
            {explained.excluded.map(({ activity, name, reason }) => (
              <li key={activity.id} className="rounded-lg bg-line p-3 text-sm">
                <p className="font-bold">{name}</p>
                <p className="text-muted">
                  {formatDateTimeVi(activity.startDate)} · không tính: {reason}
                </p>
              </li>
            ))}
          </ul>
          {explained.counted.length + explained.excluded.length === 0 && (
            <p className="mt-2 text-sm text-muted">Chưa có buổi chạy nào trong kỳ.</p>
          )}
        </>
      )}

      <h2 className="mt-5 text-lg font-black">Bảng xếp hạng</h2>
      <div className="mt-2">
        <LiveChallengeRanking
          challengeId={id}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          rows={rows}
          myMemberId={member.id}
          followingIds={followingIds}
        />
      </div>
    </section>
  )
}
