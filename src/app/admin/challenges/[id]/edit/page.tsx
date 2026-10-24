import Link from 'next/link'
import { notFound } from 'next/navigation'
import ChallengeForm from '@/components/ChallengeForm'
import { toFormDefaults } from '@/lib/challenges/formDefaults'
import { loadChallenge } from '@/lib/challenges/loadChallenges'
import type { GoalType } from '@/config/challenges'

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadChallenge(id)
  if (!data) notFound()
  const { challenge } = data
  const defaults = toFormDefaults({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    coverUrl: challenge.cover_url,
    startsAt: challenge.starts_at,
    endsAt: challenge.ends_at,
    goalType: challenge.goal_type as GoalType,
    participation: challenge.participation,
    registrationClosesAt: challenge.registration_closes_at,
    ranking: challenge.ranking,
    filter: data.filter,
    penaltyRule: data.penaltyRule,
    rewardRule: data.rewardRule,
    categories: data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      goalValue: Number(category.goal_value),
      gender: category.gender,
      memberType: category.member_type,
    })),
  })
  const isLive = challenge.status !== 'draft'

  return (
    <section>
      <Link href={`/admin/challenges/${id}`} className="text-sm text-muted underline">
        ← {challenge.title}
      </Link>
      <h1 className="mt-2 text-2xl font-black">Sửa challenge</h1>
      {isLive && (
        <p className="mt-2 rounded-lg bg-gold/30 p-3 text-sm">
          Challenge đã công bố. Sau khi lưu, bấm &quot;Tính lại tất cả&quot; ở trang chi tiết để áp luật mới cho mọi
          người.
        </p>
      )}
      <div className="mt-4">
        <ChallengeForm defaults={defaults} />
      </div>
    </section>
  )
}
