import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import BackLink from '@/components/BackLink'
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

const INPUT_CLASS = 'min-h-10 w-full rounded-md border border-line bg-white px-2.5 text-sm md:min-h-8'
const BUTTON_CLASS = 'min-h-11 rounded-md border border-line bg-white px-4 font-bold'

function tabClass(active: boolean): string {
  return `flex min-h-11 flex-1 items-center justify-center rounded-md text-sm font-bold ${active ? 'bg-brand text-white' : 'border border-line bg-white'}`
}

function LockSection({ monthKey, lock, closable }: { monthKey: string; lock: Awaited<ReturnType<typeof loadMonthLock>>; closable: boolean }) {
  if (lock) {
    return (
      <div className="mt-6 rounded-md bg-white p-3">
        <p className="font-bold text-brand-dark">Đã chốt sổ lúc {formatDateTimeVi(lock.lockedAt)}</p>
        {lock.note && <p className="text-sm text-muted">{lock.note}</p>}
        <p className="mt-1 text-sm text-muted">Không thêm hay huỷ giao dịch trong tháng này được nữa.</p>
        <ActionForm action={unlockFundMonth} className="mt-2 flex gap-2">
          <input type="hidden" name="month" value={monthKey} />
          <input name="reason" required placeholder="Lý do mở khoá" className={INPUT_CLASS} />
          <button type="submit" className={`${BUTTON_CLASS} text-danger`}>
            Mở khoá
          </button>
        </ActionForm>
      </div>
    )
  }
  if (!closable) {
    return <p className="mt-6 text-sm text-muted">Chỉ chốt sổ được các tháng đã qua.</p>
  }
  return (
    <ActionForm action={lockFundMonth} className="mt-6 flex flex-col gap-2 rounded-md bg-white p-3">
      <input type="hidden" name="month" value={monthKey} />
      <p className="font-bold">Chốt sổ tháng này</p>
      <p className="text-sm text-muted">Sau khi chốt, không thêm hay huỷ giao dịch của tháng này được nữa (trừ khi mở khoá có lý do).</p>
      <input name="note" placeholder="Ghi chú (không bắt buộc)" className={INPUT_CLASS} />
      <button type="submit" className="min-h-12 rounded-full bg-brand font-bold text-white">
        Chốt sổ
      </button>
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
      <BackLink href="/admin/fund">Quỹ</BackLink>
      <h1 className="text-2xl font-black">Báo cáo quỹ</h1>
      <div className="mt-3 flex gap-2">
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/admin/fund/reports?period=${currentPeriodKey(tab.type, now)}`}
            className={tabClass(tab.type === period.type)}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Link href={`/admin/fund/reports?period=${previousKey}`} className="flex min-h-11 items-center px-3 font-bold">
          ←
        </Link>
        <h2 className="text-lg font-black">{period.label}</h2>
        <Link href={`/admin/fund/reports?period=${nextKey}`} className="flex min-h-11 items-center px-3 font-bold">
          →
        </Link>
      </div>
      <div className="mt-2">
        <FundReportTable report={report} />
      </div>

      <h2 className="mt-6 text-lg font-black">Khoản phạt phát sinh trong kỳ</h2>
      <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
        {[
          ['Số khoản', String(penalties.issuedCount)],
          ['Tổng phát sinh', formatVnd(penalties.issuedAmount)],
          ['Đã thu', formatVnd(penalties.collectedAmount)],
          ['Còn nợ', formatVnd(penalties.outstandingAmount)],
          ['Đã miễn', formatVnd(penalties.waivedAmount)],
        ].map(([label, value]) => (
          <li key={label} className="rounded-md bg-white p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-black">{value}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <a href={`/admin/fund/reports/csv?period=${period.key}`} className={`${BUTTON_CLASS} flex flex-1 items-center justify-center`}>
          Xuất CSV
        </a>
        <Link href={`/admin/fund/reports/print?period=${period.key}`} className={`${BUTTON_CLASS} flex flex-1 items-center justify-center`}>
          Bản in
        </Link>
      </div>

      {monthStart && <LockSection monthKey={period.key} lock={lock} closable={closable} />}

      <ActionForm action={setFundCloseAutopost} className="mt-6 flex items-center gap-3 rounded-md bg-white p-3">
        <input type="checkbox" name="enabled" defaultChecked={autopost} className="size-5 accent-brand" />
        <span className="flex-1 text-sm">Khi chốt sổ tự đăng bài tóm tắt quỹ lên bảng tin</span>
        <button type="submit" className={BUTTON_CLASS}>
          Lưu
        </button>
      </ActionForm>
    </section>
  )
}
