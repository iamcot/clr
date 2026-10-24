import BackLink from '@/components/BackLink'
import FundReportTable from '@/components/FundReportTable'
import PrintButton from '@/components/PrintButton'
import type { FundReport } from '@/lib/finance/report'
import type { PenaltyReport, PublicExpense } from '@/lib/finance/loadFinance'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'

type FundReportPrintViewProps = {
  periodLabel: string
  backHref: string
  report: FundReport
  penalties: PenaltyReport
  expenses: PublicExpense[]
}

function SignatureBox({ title }: { title: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-bold">{title}</p>
      <p className="text-xs text-muted">(Ký, ghi rõ họ tên)</p>
      <div className="h-20" />
    </div>
  )
}

export default function FundReportPrintView({ periodLabel, backHref, report, penalties, expenses }: FundReportPrintViewProps) {
  return (
    <section className="mx-auto max-w-[190mm] text-sm">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <BackLink href={backHref}>Báo cáo</BackLink>
        <PrintButton label="In hoặc lưu PDF" />
      </div>
      <header className="mt-2 text-center">
        <p className="text-base font-black tracking-wide">CÂU LẠC BỘ CHẠY BỘ CLR</p>
        <p className="text-xs text-muted">Celadon Running Club</p>
        <h1 className="mt-3 text-xl font-black">BÁO CÁO QUỸ CLB</h1>
        <p className="font-bold">{periodLabel}</p>
      </header>

      <div className="mt-4">
        <FundReportTable report={report} />
      </div>

      <h2 className="mt-4 font-black">Khoản phạt phát sinh trong kỳ</h2>
      <ul className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1">
        <li className="flex justify-between">
          <span>Số khoản</span>
          <span>{penalties.issuedCount}</span>
        </li>
        <li className="flex justify-between">
          <span>Tổng phát sinh</span>
          <span>{formatVnd(penalties.issuedAmount)}</span>
        </li>
        <li className="flex justify-between">
          <span>Đã thu</span>
          <span>{formatVnd(penalties.collectedAmount)}</span>
        </li>
        <li className="flex justify-between">
          <span>Còn nợ</span>
          <span>{formatVnd(penalties.outstandingAmount)}</span>
        </li>
        <li className="flex justify-between">
          <span>Đã miễn</span>
          <span>{formatVnd(penalties.waivedAmount)}</span>
        </li>
      </ul>

      {expenses.length > 0 && (
        <>
          <h2 className="mt-4 font-black">Các khoản chi</h2>
          <table className="mt-1 w-full border-collapse">
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-line align-top">
                  <td className="w-20 py-1 pr-2 whitespace-nowrap">{formatDateVi(expense.occurredAt)}</td>
                  <td className="py-1 pr-2">
                    {expense.description || expense.category} <span className="text-muted">({expense.category})</span>
                  </td>
                  <td className="py-1 text-right whitespace-nowrap">{formatVnd(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="mt-6 flex gap-8 break-inside-avoid">
        <SignatureBox title="Thủ quỹ" />
        <SignatureBox title="Chủ nhiệm" />
      </div>
    </section>
  )
}
