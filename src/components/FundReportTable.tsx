import { formatVnd } from '@/lib/format/money'
import type { FundReport } from '@/lib/finance/report'

function Line({ label, amount, strong = false }: { label: string; amount: number; strong?: boolean }) {
  return (
    <li className={`flex justify-between gap-2 py-1.5 print:py-0.5 ${strong ? 'font-black' : ''}`}>
      <span>{label}</span>
      <span>{formatVnd(amount)}</span>
    </li>
  )
}

function Group({ title, total, categories }: { title: string; total: number; categories: FundReport['income']['categories'] }) {
  return (
    <div className="border-t border-line pt-2">
      <ul>
        <Line label={title} amount={total} strong />
        {categories.map((category) => (
          <li key={category.name} className="flex justify-between gap-2 py-1 pl-4 text-sm text-muted print:py-0">
            <span>{category.name}</span>
            <span>{formatVnd(category.amount)}</span>
          </li>
        ))}
        {categories.length === 0 && <li className="py-1 pl-4 text-sm text-muted">Không có</li>}
      </ul>
    </div>
  )
}

export default function FundReportTable({ report, bare = false }: { report: FundReport; bare?: boolean }) {
  const card = bare ? '' : 'rounded-lg bg-white p-3 shadow-sm'
  return (
    <div className={`flex flex-col gap-2 ${card} print:gap-1 print:p-0 print:shadow-none`}>
      <ul>
        <Line label="Số dư đầu kỳ" amount={report.opening} />
      </ul>
      <Group title="Tổng thu" total={report.income.total} categories={report.income.categories} />
      <Group title="Tổng chi" total={report.expense.total} categories={report.expense.categories} />
      <ul className="border-t border-line pt-2">
        <Line label="Số dư cuối kỳ" amount={report.closing} strong />
      </ul>
    </div>
  )
}
