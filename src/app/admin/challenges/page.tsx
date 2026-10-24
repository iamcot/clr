import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { STATUS_LABELS, type ChallengeStatus } from '@/config/challenges'
import { createFromTemplate } from '@/lib/challenges/adminActions'
import { loadChallenges, loadTemplateChallengeId } from '@/lib/challenges/loadChallenges'
import { formatDateVi } from '@/lib/format/dateTime'

const STATUS_ORDER: ChallengeStatus[] = ['running', 'finalizing', 'published', 'draft', 'closed']

export default async function AdminChallengesPage() {
  const [challenges, templateId] = await Promise.all([loadChallenges(), loadTemplateChallengeId()])

  return (
    <section>
      <h1 className="text-2xl font-black">Challenge</h1>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/admin/challenges/new"
          className="flex min-h-12 items-center justify-center rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
        >
          Tạo challenge
        </Link>
        {templateId && (
          <ActionForm action={createFromTemplate}>
            <button type="submit" className="min-h-12 w-full rounded-lg border border-line bg-white font-bold">
              Tạo từ challenge mẫu (tháng sau)
            </button>
          </ActionForm>
        )}
        <Link
          href="/admin/challenges/summary"
          className="flex min-h-11 items-center font-bold text-brand-dark underline"
        >
          Tổng hợp nhiều kỳ
        </Link>
      </div>
      {STATUS_ORDER.map((status) => {
        const group = challenges.filter((challenge) => challenge.status === status)
        if (group.length === 0) return null
        return (
          <div key={status} className="mt-6">
            <h2 className="text-lg font-black">{STATUS_LABELS[status]}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {group.map((challenge) => (
                <li key={challenge.id}>
                  <Link href={`/admin/challenges/${challenge.id}`} className="block rounded-lg bg-white shadow-sm p-3">
                    <p className="font-bold">
                      {challenge.title}
                      {challenge.id === templateId && <span className="ml-2 text-xs text-brand-dark">Mẫu</span>}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateVi(challenge.starts_at)} đến {formatDateVi(challenge.ends_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {challenges.length === 0 && <p className="mt-4 text-muted">Chưa có challenge nào.</p>}
    </section>
  )
}
