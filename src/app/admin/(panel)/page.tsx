import Link from 'next/link'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import { OVERVIEW_ACTIVITY_DAYS } from '@/config/members'
import { loadAdminOverview, type AdminOverview } from '@/lib/admin/overview'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'

type TodoItem = { label: string; count: number; href: string }

function todoItems(overview: AdminOverview): TodoItem[] {
  return [
    { label: 'Thành viên chờ duyệt', count: overview.pendingMembers, href: '/admin/members?status=pending' },
    { label: 'Khoản phạt chưa nộp', count: overview.unpaidPenaltyCount, href: '/admin/penalties' },
    { label: 'Giao dịch ngân hàng cần xử lý', count: overview.fundQueueCount, href: '/admin/fund' },
  ].filter((item) => item.count > 0)
}

function TodoList({ items }: { items: TodoItem[] }) {
  if (items.length === 0) return <p className="text-muted">Không có việc nào đang chờ.</p>
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="flex min-h-12 items-center justify-between gap-3 py-2">
            <span>{item.label}</span>
            <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-sm font-bold text-danger">{item.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function AdminHomePage() {
  const now = new Date()
  const overview = await loadAdminOverview(now)

  return (
    <section>
      <AdminPageHeader
        title="Tổng quan"
        description={formatDateVi(now.toISOString())}
        actions={
          <>
            <Link href="/admin/posts/new" className={adminButtonClass('secondary')}>
              Đăng thông báo
            </Link>
            <Link href="/admin/challenges/new" className={adminButtonClass('primary')}>
              + Tạo challenge
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Thành viên hoạt động" value={overview.activeMembers} href="/admin/members?status=active" />
        <StatCard
          label={`Hoạt động ${OVERVIEW_ACTIVITY_DAYS} ngày`}
          value={overview.recentActivities}
          hint="được tính cho CLB"
          href="/admin/activities?show=counted"
        />
        <StatCard label="Challenge đang chạy" value={overview.runningChallenges} href="/admin/challenges" />
        <StatCard label="Quỹ CLB" value={formatVnd(overview.fundBalance)} href="/admin/fund" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Cần xử lý">
          <TodoList items={todoItems(overview)} />
        </AdminCard>
        <AdminCard title="Phạt chưa nộp">
          <p className="text-3xl font-black">{formatVnd(overview.unpaidPenaltyAmount)}</p>
          <p className="mt-1 text-sm text-muted">{overview.unpaidPenaltyCount} khoản · nộp qua VietQR tự gạch nợ</p>
          <Link href="/admin/penalties" className={`${adminButtonClass('secondary')} mt-3 w-full sm:w-auto`}>
            Xem thưởng phạt
          </Link>
        </AdminCard>
      </div>
    </section>
  )
}
