import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { REWARD_STATUS_LABELS } from '@/config/penalties'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'
import { markRewardGiven } from '@/lib/penalties/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const REWARD_LIST_LIMIT = 500

export default async function AdminRewardsPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('rewards')
    .select('*, members!rewards_member_id_fkey(display_name, member_code)')
    .order('status')
    .order('created_at', { ascending: false })
    .limit(REWARD_LIST_LIMIT)
  const rewards = data ?? []

  return (
    <section>
      <Link href="/admin/penalties" className="text-sm text-muted underline">
        ← Thưởng phạt
      </Link>
      <h1 className="mt-2 text-2xl font-black">Thưởng</h1>
      <ul className="mt-3 flex flex-col gap-2">
        {rewards.map((reward) => (
          <li key={reward.id} className="rounded-lg bg-white p-3">
            <p className="font-bold">
              {reward.members?.display_name ?? 'Thành viên'}{' '}
              <span className="font-normal text-muted">{reward.members?.member_code}</span>
            </p>
            <p className="text-sm">
              {reward.title}
              {reward.amount ? ` · ${formatVnd(Number(reward.amount))}` : ''}
            </p>
            <p className="text-xs text-muted">
              {formatDateVi(reward.created_at)} ·{' '}
              {REWARD_STATUS_LABELS[reward.status as keyof typeof REWARD_STATUS_LABELS]}
            </p>
            {reward.status === 'pending' && (
              <ActionForm action={markRewardGiven} className="mt-1">
                <input type="hidden" name="id" value={reward.id} />
                <button type="submit" className="min-h-11 rounded-lg border border-line px-4 font-bold">
                  Đã trao
                </button>
              </ActionForm>
            )}
          </li>
        ))}
      </ul>
      {rewards.length === 0 && <p className="mt-4 text-muted">Chưa có khoản thưởng nào.</p>}
    </section>
  )
}
