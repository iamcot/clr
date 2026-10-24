import Image from 'next/image'
import Link from 'next/link'
import BackLink from '@/components/BackLink'
import FundMonthlyChart from '@/components/FundMonthlyChart'
import FundReportTable from '@/components/FundReportTable'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { currentPeriodKey, parseReportPeriod, shiftPeriodKey } from '@/lib/finance/period'
import { loadCurrentBalance, loadFundReport, loadMonthlyFlows, loadPublicExpenses } from '@/lib/finance/loadFinance'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'

const CHART_MONTHS = 12

export default async function ClubFundPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireActiveMember()
  const now = new Date()
  const currentKey = currentPeriodKey('month', now)
  const requested = parseReportPeriod((await searchParams).month)
  const period = requested?.type === 'month' ? requested : parseReportPeriod(currentKey)
  if (!period) return null

  const [balance, flows, report, expenses] = await Promise.all([
    loadCurrentBalance(now),
    loadMonthlyFlows(CHART_MONTHS),
    loadFundReport(period.from, period.to),
    loadPublicExpenses(period),
  ])
  const previousKey = shiftPeriodKey(period.key, -1)
  const nextKey = shiftPeriodKey(period.key, 1)

  return (
    <section>
      <BackLink href="/fund">Quỹ</BackLink>
      <h1 className="text-2xl font-black">Quỹ CLB</h1>
      <div className="mt-3 rounded-2xl bg-deep p-4 text-white">
        <p className="text-sm text-white/70">Số dư hiện tại</p>
        <p className="text-4xl font-black">{formatVnd(balance)}</p>
      </div>

      <h2 className="mt-6 text-lg font-black">Thu chi 12 tháng</h2>
      <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
        <FundMonthlyChart flows={flows} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link href={`/fund/club?month=${previousKey}`} className="flex min-h-11 items-center px-3 font-bold text-brand-dark">
          ←
        </Link>
        <h2 className="text-lg font-black">{period.label}</h2>
        {period.key < currentKey ? (
          <Link href={`/fund/club?month=${nextKey}`} className="flex min-h-11 items-center px-3 font-bold text-brand-dark">
            →
          </Link>
        ) : (
          <span className="min-h-11 px-3" />
        )}
      </div>
      <div className="mt-2">
        <FundReportTable report={report} />
      </div>
      <p className="mt-2 text-xs text-muted">Khoản thu từ phạt chỉ hiện tổng, không hiện tên từng người.</p>

      <h2 className="mt-6 text-lg font-black">Các khoản chi</h2>
      {expenses.length === 0 && <p className="mt-2 text-sm text-muted">Tháng này chưa có khoản chi nào.</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {expenses.map((expense) => (
          <li key={expense.id} className="rounded-lg bg-white p-3 shadow-sm">
            <div className="flex justify-between gap-2">
              <p className="min-w-0 font-bold">{expense.description || expense.category}</p>
              <p className="font-black text-danger">{formatVnd(expense.amount)}</p>
            </div>
            <p className="text-xs text-muted">
              {formatDateVi(expense.occurredAt)} · {expense.category}
            </p>
            {expense.receiptUrl && (
              <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                <Image src={expense.receiptUrl} alt="Hoá đơn" width={96} height={96} className="size-24 rounded object-cover" unoptimized />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
