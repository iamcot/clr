import { FUND_DIRECTION_LABELS } from '@/config/fund'
import { getBcnMember } from '@/lib/auth/requireBcn'
import { logAudit } from '@/lib/audit/logAudit'
import { parseReportPeriod } from '@/lib/finance/period'
import { loadPeriodTransactions } from '@/lib/finance/loadPeriodTransactions'
import { csvResponse, toCsv } from '@/lib/format/csv'
import { toVietnamInputValue } from '@/lib/format/dateTime'

const HEADERS = ['Thời điểm', 'Loại', 'Danh mục', 'Nội dung', 'Số tiền', 'Tài khoản', 'Trạng thái', 'Lý do huỷ']

export async function GET(request: Request) {
  if (!(await getBcnMember())) return new Response('Not found', { status: 404 })
  const period = parseReportPeriod(new URL(request.url).searchParams.get('period') ?? undefined)
  if (!period) return new Response('Kỳ báo cáo không hợp lệ', { status: 400 })

  const rows = await loadPeriodTransactions(period)
  const cells = rows.map((row) => [
    toVietnamInputValue(row.occurredAt).replace('T', ' '),
    FUND_DIRECTION_LABELS[row.direction],
    row.category,
    row.description,
    row.amount,
    row.account,
    row.voided ? 'Đã huỷ' : 'Hợp lệ',
    row.voidReason,
  ])
  await logAudit({ action: 'export_fund_report', targetTable: 'fund_transactions', targetId: period.key, after: { count: rows.length } })
  return csvResponse(toCsv(HEADERS, cells), `clr-quy-${period.key}.csv`)
}
