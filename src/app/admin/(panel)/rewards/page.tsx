import ActionForm from '@/components/ActionForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { adminButtonClass } from '@/components/admin/styles'
import { describePage, hrefWithPage, pageRange, parsePage } from '@/lib/admin/pagination'
import { REWARD_STATUS_LABELS } from '@/config/penalties'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import { markRewardGiven } from '@/lib/penalties/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function loadRewards(page: number) {
  const supabase = await createSupabaseServerClient()
  const { from, to } = pageRange(page)
  const { data, count } = await supabase
    .from('rewards')
    .select('*, members!rewards_member_id_fkey(display_name, member_code)', { count: 'exact' })
    .order('status')
    .order('created_at', { ascending: false })
    .range(from, to)
  return { rows: data ?? [], total: count ?? 0 }
}

type RewardRow = Awaited<ReturnType<typeof loadRewards>>['rows'][number]

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

export default async function AdminRewardsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = parsePage(params.page)
  const { rows: rewards, total } = await loadRewards(page)

  return (
    <section>
      <AdminPageHeader title="Thưởng" backHref="/admin/penalties" backLabel="Thưởng phạt" />
      <DataTable columns={COLUMNS} rows={rewards} rowKey={(reward) => reward.id} emptyText="Chưa có khoản thưởng nào." />
      <Pagination
        window={describePage(page, total)}
        hrefFor={(target) => hrefWithPage('/admin/rewards', params, target)}
        unit="khoản thưởng"
      />
    </section>
  )
}
