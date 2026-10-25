import Image from 'next/image'
import ActionForm from '@/components/ActionForm'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import { FUND_DIRECTION_LABELS } from '@/config/fund'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import { voidFundTransaction } from '@/lib/fund/adminActions'
import { setReceiptPublic } from '@/lib/fund/reportActions'
import type { FundTransactionRow } from '@/lib/fund/loadAdminFund'

function RowActions({ row }: { row: FundTransactionRow }) {
  if (row.voidedAt !== null) return <Badge tone="danger">Đã huỷ: {row.voidReason}</Badge>
  return (
    <details className="min-w-44">
      <summary className="flex min-h-8 cursor-pointer items-center text-sm font-bold text-brand-dark">Thao tác</summary>
      <div className="flex flex-col gap-2 py-2">
        {row.receiptUrl && (
          <ActionForm action={setReceiptPublic}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="public" value={row.receiptPublic ? 'false' : 'true'} />
            <button type="submit" className={adminButtonClass('secondary')}>
              {row.receiptPublic ? 'Ẩn ảnh hoá đơn' : 'Cho thành viên xem hoá đơn'}
            </button>
          </ActionForm>
        )}
        <ActionForm action={voidFundTransaction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={row.id} />
          <input name="reason" required placeholder="Lý do huỷ" className={ADMIN_INPUT_CLASS} />
          <button type="submit" className={adminButtonClass('danger')}>
            Huỷ giao dịch
          </button>
        </ActionForm>
      </div>
    </details>
  )
}

const COLUMNS: DataTableColumn<FundTransactionRow>[] = [
  {
    key: 'amount',
    header: 'Số tiền',
    cell: (row) => (
      <span
        className={`font-black ${row.direction === 'in' ? 'text-brand-dark' : 'text-danger'} ${row.voidedAt ? 'line-through opacity-60' : ''}`}
      >
        {row.direction === 'in' ? '+' : '−'}
        {formatVndCompact(row.amount)}
      </span>
    ),
  },
  {
    key: 'category',
    header: 'Danh mục',
    cell: (row) => (
      <span>
        {row.categoryName}
        <span className="block text-xs text-muted">{FUND_DIRECTION_LABELS[row.direction]}</span>
      </span>
    ),
  },
  {
    key: 'description',
    header: 'Nội dung',
    hideBelowMd: true,
    cell: (row) => (
      <span className="break-words">
        {row.description || '—'}
        {row.memberName && <span className="block text-xs text-muted">{row.memberName}</span>}
      </span>
    ),
  },
  {
    key: 'time',
    header: 'Thời điểm',
    hideBelowMd: true,
    cell: (row) => (
      <span>
        {formatDateTimeVi(row.occurredAt)}
        <span className="block text-xs text-muted">{row.accountName}</span>
      </span>
    ),
  },
  {
    key: 'receipt',
    header: 'Hoá đơn',
    hideBelowMd: true,
    cell: (row) =>
      row.receiptUrl ? (
        <a href={row.receiptUrl} target="_blank" rel="noopener noreferrer">
          <Image src={row.receiptUrl} alt="Hoá đơn" width={40} height={40} className="size-10 rounded object-cover" unoptimized />
        </a>
      ) : (
        '—'
      ),
  },
  { key: 'actions', header: '', cell: (row) => <RowActions row={row} /> },
]

export default function FundTransactionsList({ rows }: { rows: FundTransactionRow[] }) {
  return <DataTable columns={COLUMNS} rows={rows} rowKey={(row) => row.id} emptyText="Chưa có giao dịch nào." />
}
