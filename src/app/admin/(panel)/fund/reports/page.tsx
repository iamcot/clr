import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import StatCard from '@/components/admin/StatCard'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import FundReportTable from '@/components/FundReportTable'
import { requireBcn } from '@/lib/auth/requireBcn'
import {
  loadCloseAutopostEnabled,
  loadFundReport,
  loadMonthLock,
  loadPenaltyReport,
} from '@/lib/finance/loadFinance'
import {
  currentPeriodKey,
  monthStartDate,
  parseReportPeriod,
  shiftPeriodKey,
  type ReportPeriodType,
} from '@/lib/finance/period'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'
import { lockFundMonth, setFundCloseAutopost, unlockFundMonth } from '@/lib/fund/reportActions'

const TYPE_TABS: { type: ReportPeriodType; label: string }[] = [
  { type: 'month', label: 'Tháng' },
  { type: 'quarter', label: 'Quý' },
  { type: 'year', label: 'Năm' },
]

function LockSection({
  monthKey,
  lock,
  closable,
}: {
  monthKey: string
  lock: Awaited<ReturnType<typeof loadMonthLock>>
  closable: boolean
}) {
  if (lock) {
    return (
      <div>
        <p className="flex items-center gap-2 font-bold">
          <Badge tone="success">Đã chốt sổ</Badge>
          <span className="text-sm font-normal text-muted">{formatDateTimeVi(lock.lockedAt)}</span>
        </p>
        {lock.note && <p className="mt-1 text-sm text-muted">{lock.note}</p>}
        <p className="mt-1 text-sm text-muted">Không thêm hay huỷ giao dịch trong tháng này được nữa.</p>
        <ActionForm action={unlockFundMonth} className="mt-3 flex flex-col gap-2 md:flex-row">
          <input type="hidden" name="month" value={monthKey} />
          <input name="reason" required placeholder="Lý do mở khoá" className={ADMIN_INPUT_CLASS} />
          <button type="submit" className={adminButtonClass('danger')}>
            Mở khoá
          </button>
        </ActionForm>
      </div>
    )
  }
  if (!closable) return <p className="text-sm text-muted">Chỉ chốt sổ được các tháng đã qua.</p>
  return (
    <ActionForm action={lockFundMonth} className="flex flex-col gap-2">
      <input type="hidden" name="month" value={monthKey} />
      <p className="text-sm text-muted">
        Sau khi chốt, không thêm hay huỷ giao dịch của tháng này được nữa (trừ khi mở khoá có lý do).
      </p>
      <div className="flex flex-col gap-2 md:flex-row">
        <input name="note" placeholder="Ghi chú (không bắt buộc)" className={ADMIN_INPUT_CLASS} />
        <button type="submit" className={adminButtonClass('primary')}>
          Chốt sổ tháng này
        </button>
      </div>
    </ActionForm>
  )
}

export default async function FundReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requireBcn()
  const now = new Date()
  const period = parseReportPeriod((await searchParams).period) ?? parseReportPeriod(currentPeriodKey('month', now))
  if (!period) return null

  const monthStart = period.type === 'month' ? monthStartDate(period.key) : null
  const [report, penalties, lock, autopost] = await Promise.all([
    loadFundReport(period.from, period.to),
    loadPenaltyReport(period),
    monthStart ? loadMonthLock(monthStart) : null,
    loadCloseAutopostEnabled(),
  ])
  const previousKey = shiftPeriodKey(period.key, -1)
  const nextKey = shiftPeriodKey(period.key, 1)
  const closable = Date.parse(period.to) <= now.getTime()

  return (
    <section>
      <AdminPageHeader
        title="Báo cáo quỹ"
        backHref="/admin/fund"
        backLabel="Quỹ"
        actions={
          <>
            <a href={`/admin/fund/reports/csv?period=${period.key}`} className={adminButtonClass('secondary')}>
              Xuất CSV
            </a>
            <Link href={`/admin/fund/reports/print?period=${period.key}`} className={adminButtonClass('secondary')}>
              Bản in
            </Link>
          </>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs
          items={TYPE_TABS.map((tab) => ({
            href: `/admin/fund/reports?period=${currentPeriodKey(tab.type, now)}`,
            label: tab.label,
            active: tab.type === period.type,
          }))}
        />
        <div className="flex items-center gap-2">
          <Link href={`/admin/fund/reports?period=${previousKey}`} className={adminButtonClass('secondary')} aria-label="Kỳ trước">
            ←
          </Link>
          <span className="min-w-32 text-center font-black">{period.label}</span>
          <Link href={`/admin/fund/reports?period=${nextKey}`} className={adminButtonClass('secondary')} aria-label="Kỳ sau">
            →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Số dư đầu kỳ" value={formatVnd(report.opening)} />
        <StatCard label="Tổng thu" value={formatVnd(report.income.total)} />
        <StatCard label="Tổng chi" value={formatVnd(report.expense.total)} />
        <StatCard label="Số dư cuối kỳ" value={formatVnd(report.closing)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Chi tiết thu chi">
          <FundReportTable report={report} bare />
        </AdminCard>
        <AdminCard title="Khoản phạt phát sinh trong kỳ">
          <ul className="divide-y divide-hairline text-sm">
            {[
              ['Số khoản', String(penalties.issuedCount)],
              ['Tổng phát sinh', formatVnd(penalties.issuedAmount)],
              ['Đã thu', formatVnd(penalties.collectedAmount)],
              ['Còn nợ', formatVnd(penalties.outstandingAmount)],
              ['Đã miễn', formatVnd(penalties.waivedAmount)],
            ].map(([label, value]) => (
              <li key={label} className="flex justify-between py-2">
                <span className="text-muted">{label}</span>
                <b>{value}</b>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <AdminCard title="Chốt sổ" className="mt-4">
        {monthStart ? (
          <LockSection monthKey={period.key} lock={lock} closable={closable} />
        ) : (
          <p className="text-sm text-muted">Chọn xem theo tháng để chốt sổ.</p>
        )}
        <ActionForm action={setFundCloseAutopost} className="mt-4 flex items-center gap-3 border-t border-hairline pt-4">
          <input type="checkbox" name="enabled" defaultChecked={autopost} className="size-5 accent-brand" />
          <span className="flex-1 text-sm">Khi chốt sổ tự đăng bài tóm tắt quỹ lên bảng tin</span>
          <button type="submit" className={adminButtonClass('secondary')}>
            Lưu
          </button>
        </ActionForm>
      </AdminCard>
    </section>
  )
}
