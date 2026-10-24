import ChallengeCard from '@/components/ChallengeCard'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadChallenges, type ChallengeRow } from '@/lib/challenges/loadChallenges'
import { challengePhase } from '@/lib/challenges/status'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ChallengeStatus } from '@/config/challenges'

type MyEntrySummary = { progressPct: number; completed: boolean }

async function loadMyEntries(memberId: string): Promise<Map<string, MyEntrySummary>> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('challenge_entries')
    .select('challenge_id, progress_pct, completed')
    .eq('member_id', memberId)
  return new Map(
    (data ?? []).map((row) => [row.challenge_id, { progressPct: Number(row.progress_pct), completed: row.completed }]),
  )
}

function periodText(challenge: ChallengeRow): string {
  return `${formatDateTimeVi(challenge.starts_at)} - ${formatDateTimeVi(challenge.ends_at)}`
}

function Group({ title, children }: { title: string; children: React.ReactNode[] }) {
  if (children.length === 0) return null
  return (
    <div className="mt-6">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </div>
  )
}

export default async function ChallengesPage() {
  const member = await requireActiveMember()
  const [challenges, mine] = await Promise.all([loadChallenges(), loadMyEntries(member.id)])
  const now = new Date()
  const phaseOf = (challenge: ChallengeRow) =>
    challengePhase(challenge.status as ChallengeStatus, challenge.starts_at, challenge.ends_at, now)
  const href = (challenge: ChallengeRow) => `/challenges/${challenge.id}`

  const running = challenges.filter((challenge) => phaseOf(challenge) === 'running')
  const upcoming = challenges.filter((challenge) => phaseOf(challenge) === 'upcoming')
  const ended = challenges.filter((challenge) => phaseOf(challenge) === 'ended')

  return (
    <section>
      <h1 className="text-2xl font-black">Challenge</h1>
      {challenges.length === 0 && <p className="mt-4 text-muted">Chưa có challenge nào.</p>}
      <Group title="Đang diễn ra">
        {running.map((challenge) => {
          const entry = mine.get(challenge.id)
          return (
            <ChallengeCard
              key={challenge.id}
              href={href(challenge)}
              title={challenge.title}
              subtitle={entry ? `Tiến độ của bạn ${Math.round(entry.progressPct)}%` : 'Bạn chưa tham gia'}
              progressPct={entry?.progressPct}
              badge={entry?.completed ? 'Hoàn thành' : undefined}
            />
          )
        })}
      </Group>
      <Group title="Sắp tới">
        {upcoming.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            href={href(challenge)}
            title={challenge.title}
            subtitle={`Bắt đầu ${formatDateTimeVi(challenge.starts_at)}`}
            badge={mine.has(challenge.id) ? 'Đã tham gia' : undefined}
          />
        ))}
      </Group>
      <Group title="Đã kết thúc">
        {ended.map((challenge) => {
          const entry = mine.get(challenge.id)
          const result = entry ? (entry.completed ? 'Hoàn thành' : 'Không đạt') : undefined
          return (
            <ChallengeCard
              key={challenge.id}
              href={href(challenge)}
              title={challenge.title}
              subtitle={periodText(challenge)}
              badge={result}
            />
          )
        })}
      </Group>
    </section>
  )
}
