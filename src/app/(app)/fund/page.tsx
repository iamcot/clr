import CopyButton from '@/components/CopyButton'
import { PENALTY_STATUS_LABELS, REWARD_STATUS_LABELS, type PenaltyStatus } from '@/config/penalties'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'
import { currentMonthVn, monthRangeVn, summarizePenalties, transferNote } from '@/lib/penalties/calc'
import { loadFundSettings } from '@/lib/penalties/fundSettings'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function loadMyPenalties(memberId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('penalties')
    .select('id, amount, reason, status, created_at, penalty_types(name)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

async function loadMyRewards(memberId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('rewards')
    .select('id, title, amount, status, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

async function loadMonthTotals(month: string) {
  const range = monthRangeVn(month)
  if (!range) return []
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('penalty_totals', {
    p_from: range.from,
    p_to: range.to,
  })
  return data ?? []
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate font-bold">{value}</p>
      </div>
      <CopyButton text={value} label="Sao chép" />
    </div>
  )
}

export default async function FundPage() {
  const member = await requireActiveMember()
  const now = new Date()
  const month = currentMonthVn(now)
  const [penalties, rewards, fund, totals] = await Promise.all([
    loadMyPenalties(member.id),
    loadMyRewards(member.id),
    loadFundSettings(),
    loadMonthTotals(month),
  ])
  const owed = summarizePenalties(
    penalties.map((penalty) => ({
      amount: Number(penalty.amount),
      status: penalty.status as PenaltyStatus,
    })),
  ).outstanding
  const hasAccount = fund.accountNumber !== ''

  return (
    <section>
      <h1 className="text-2xl font-black">Quỹ</h1>
      <div className={`mt-3 rounded-lg p-4 text-center ${owed > 0 ? 'bg-white' : 'bg-lime/30'}`}>
        <p className="text-sm text-muted">Bạn còn nợ</p>
        <p className={`text-4xl font-black ${owed > 0 ? 'text-danger' : 'text-brand-dark'}`}>{formatVnd(owed)}</p>
      </div>

      {owed > 0 && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg bg-white p-3">
          <p className="font-bold">Cách nộp</p>
          {hasAccount ? (
            <>
              <CopyRow label={fund.bankName || 'Ngân hàng'} value={fund.accountNumber} />
              {fund.accountHolder && <p className="text-sm text-muted">Chủ tài khoản: {fund.accountHolder}</p>}
              <CopyRow label="Nội dung chuyển khoản" value={transferNote(member.member_code, now)} />
              <p className="text-xs text-muted">BCN sẽ đánh dấu đã nộp sau khi nhận được tiền.</p>
            </>
          ) : (
            <p className="text-sm text-muted">BCN chưa nhập thông tin tài khoản. Vui lòng hỏi BCN để nộp.</p>
          )}
        </div>
      )}

      <h2 className="mt-6 text-lg font-black">Các khoản phạt</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {penalties.map((penalty) => (
          <li key={penalty.id} className="rounded-lg bg-white p-3">
            <div className="flex justify-between gap-2">
              <p className="font-bold">{penalty.penalty_types?.name}</p>
              <p className="font-black">{formatVnd(Number(penalty.amount))}</p>
            </div>
            <p className="text-sm text-muted">{penalty.reason}</p>
            <p className="text-xs text-muted">
              {formatDateVi(penalty.created_at)} · {PENALTY_STATUS_LABELS[penalty.status as PenaltyStatus]}
            </p>
          </li>
        ))}
      </ul>
      {penalties.length === 0 && <p className="mt-2 text-sm text-muted">Bạn chưa có khoản phạt nào.</p>}

      {rewards.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-black">Thưởng của bạn</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {rewards.map((reward) => (
              <li key={reward.id} className="rounded-lg bg-white p-3">
                <p className="font-bold">
                  {reward.title}
                  {reward.amount ? ` · ${formatVnd(Number(reward.amount))}` : ''}
                </p>
                <p className="text-xs text-muted">
                  {formatDateVi(reward.created_at)} ·{' '}
                  {REWARD_STATUS_LABELS[reward.status as keyof typeof REWARD_STATUS_LABELS]}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {totals.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-black">Tổng phạt tháng {Number(month.slice(5))}</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {totals.map((row) => (
              <li key={row.member_id} className="flex justify-between rounded-lg bg-white p-3 text-sm">
                <span>{row.display_name ?? 'Thành viên'}</span>
                <span className="font-bold">
                  {formatVnd(row.total_amount)}
                  {row.unpaid_amount === 0 && ' ✓'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
