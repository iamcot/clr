import { notFound } from 'next/navigation'
import FundReportPrintView from '@/components/FundReportPrintView'
import { requireBcn } from '@/lib/auth/requireBcn'
import { loadFundReport, loadPenaltyReport, loadPublicExpenses } from '@/lib/finance/loadFinance'
import { parseReportPeriod } from '@/lib/finance/period'

export default async function FundReportPrintPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requireBcn()
  const period = parseReportPeriod((await searchParams).period)
  if (!period) notFound()
  const [report, penalties, expenses] = await Promise.all([
    loadFundReport(period.from, period.to),
    loadPenaltyReport(period),
    loadPublicExpenses(period),
  ])

  return (
    <FundReportPrintView
      periodLabel={period.label}
      backHref={`/admin/fund/reports?period=${period.key}`}
      report={report}
      penalties={penalties}
      expenses={expenses}
    />
  )
}
