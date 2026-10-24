import Link from 'next/link'
import { OVERVIEW_ACTIVITY_DAYS } from '@/config/members'
import { loadAdminOverview } from '@/lib/admin/overview'

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <>
      <span className="block text-3xl font-black text-brand-dark">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </>
  )
  const className = 'block rounded-lg bg-white p-4'
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}

export default async function AdminHomePage() {
  const overview = await loadAdminOverview(new Date())

  return (
    <section>
      <h1 className="text-2xl font-black">Tổng quan</h1>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Thành viên đang hoạt động" value={overview.activeMembers} href="/admin/members?status=active" />
        <StatCard label="Chờ duyệt" value={overview.pendingMembers} href="/admin/members" />
        <StatCard
          label={`Hoạt động ${OVERVIEW_ACTIVITY_DAYS} ngày qua (được tính)`}
          value={overview.recentActivities}
          href="/admin/activities?show=counted"
        />
      </div>
    </section>
  )
}
