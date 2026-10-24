import ActionForm from '@/components/ActionForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { adminButtonClass } from '@/components/admin/styles'
import { REWARD_STATUS_LABELS } from '@/config/penalties'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import { markRewardGiven } from '@/lib/penalties/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const REWARD_LIST_LIMIT = 500

async function loadRewards() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('rewards')
    .select('*, members!rewards_member_id_fkey(display_name, member_code)')
    .order('status')
    .order('created_at', { ascending: false })
    .limit(REWARD_LIST_LIMIT)
  return data ?? []
}

type RewardRow = Awaited<ReturnType<typeof loadRewards>>[number]

const COLUMNS: DataTableColumn<RewardRow>[] = [
  {
    key: 'member',
    header: 'Thành viên',
    cell: (reward) => (
      <span>
        <b>{reward.members?.display_name ?? 'Thành viên'}</b>
        <span className="block text-xs text-muted">{reward.members?.member_code}</span>
      </span>
    ),
  },
  { key: 'title', header: 'Khoản thưởng', cell: (reward) => reward.title },
  {
    key: 'amount',
    header: 'Giá trị',
    align: 'right',
    cell: (reward) => (reward.amount ? formatVndCompact(Number(reward.amount)) : '—'),
  },
  { key: 'date', header: 'Ngày', hideBelowMd: true, cell: (reward) => formatDateVi(reward.created_at) },
  {
    key: 'status',
    header: 'Trạng thái',
    cell: (reward) => (
      <Badge tone={reward.status === 'pending' ? 'warning' : 'success'}>
        {REWARD_STATUS_LABELS[reward.status as keyof typeof REWARD_STATUS_LABELS]}
      </Badge>
    ),
  },
  {
    key: 'action',
    header: '',
    cell: (reward) =>
      reward.status === 'pending' && (
        <ActionForm action={markRewardGiven}>
          <input type="hidden" name="id" value={reward.id} />
          <button type="submit" className={adminButtonClass('secondary')}>
            Đã trao
          </button>
        </ActionForm>
      ),
  },
]

export default async function AdminRewardsPage() {
  const rewards = await loadRewards()

  return (
    <section>
      <AdminPageHeader title="Thưởng" backHref="/admin/penalties" backLabel="Thưởng phạt" />
      <DataTable columns={COLUMNS} rows={rewards} rowKey={(reward) => reward.id} emptyText="Chưa có khoản thưởng nào." />
    </section>
  )
}
