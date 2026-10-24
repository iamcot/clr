import { PAYMENT_METHOD_LABELS, PENALTY_STATUS_LABELS } from '@/config/penalties'
import { getBcnMember } from '@/lib/auth/requireBcn'
import { logAudit } from '@/lib/audit/logAudit'
import { csvResponse, toCsv } from '@/lib/format/csv'
import { loadPenalties } from '@/lib/penalties/loadPenalties'

const HEADERS = [
  'Mã',
  'Tên',
  'Loại',
  'Số tiền',
  'Lý do',
  'Trạng thái',
  'Ngày tạo',
  'Hình thức nộp',
  'Mã giao dịch',
  'Lý do miễn',
]

export async function GET(request: Request) {
  if (!(await getBcnMember())) return new Response('Not found', { status: 404 })
  const params = new URL(request.url).searchParams
  const rows = await loadPenalties({
    month: params.get('month') ?? undefined,
    status: params.get('status') ?? undefined,
    typeCode: params.get('type') ?? undefined,
  })

  const cells = rows.map((row) => [
    row.memberCode,
    row.memberName,
    row.typeName,
    row.amount,
    row.reason,
    PENALTY_STATUS_LABELS[row.status],
    row.createdAt.slice(0, 10),
    row.paidMethod
      ? (PAYMENT_METHOD_LABELS[row.paidMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? row.paidMethod)
      : null,
    row.paymentRef,
    row.waivedReason,
  ])
  await logAudit({
    action: 'export_penalties',
    targetTable: 'penalties',
    targetId: 'all',
    after: { count: rows.length },
  })
  return csvResponse(toCsv(HEADERS, cells), 'clr-penalties.csv')
}
