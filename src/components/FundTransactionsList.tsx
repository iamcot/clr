import Image from 'next/image'
import ActionForm from '@/components/ActionForm'
import { FUND_DIRECTION_LABELS } from '@/config/fund'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import { voidFundTransaction } from '@/lib/fund/adminActions'
import { setReceiptPublic } from '@/lib/fund/reportActions'
import type { FundTransactionRow } from '@/lib/fund/loadAdminFund'

function VoidForm({ id }: { id: string }) {
  return (
    <details className="mt-1">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-danger">Huỷ giao dịch</summary>
      <ActionForm action={voidFundTransaction} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="reason"
          required
          placeholder="Lý do huỷ"
          className="min-h-10 w-full rounded-md border border-line bg-white px-2.5 text-sm md:min-h-8"
        />
        <button type="submit" className="min-h-11 rounded-md border border-line bg-white px-4 font-bold text-danger">
          Huỷ
        </button>
      </ActionForm>
    </details>
  )
}

function Row({ row }: { row: FundTransactionRow }) {
  const voided = row.voidedAt !== null
  return (
    <li className={`rounded-md bg-white p-3 ${voided ? 'opacity-60' : ''}`}>
      <div className="flex justify-between gap-2">
        <p className={`font-black ${row.direction === 'in' ? 'text-brand-dark' : 'text-danger'} ${voided ? 'line-through' : ''}`}>
          {row.direction === 'in' ? '+' : '−'}
          {formatVndCompact(row.amount)}
        </p>
        <p className="text-sm text-muted">
          {FUND_DIRECTION_LABELS[row.direction]} · {row.categoryName}
        </p>
      </div>
      {row.description && <p className="text-sm break-words">{row.description}</p>}
      <p className="text-xs text-muted">
        {formatDateTimeVi(row.occurredAt)} · {row.accountName}
        {row.memberName && ` · ${row.memberName}`}
      </p>
      {row.receiptUrl && (
        <a href={row.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block">
          <Image src={row.receiptUrl} alt="Hoá đơn" width={64} height={64} className="size-16 rounded object-cover" unoptimized />
        </a>
      )}
      {row.receiptUrl && !voided && (
        <ActionForm action={setReceiptPublic} className="mt-1">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="public" value={row.receiptPublic ? 'false' : 'true'} />
          <button type="submit" className="min-h-11 text-sm font-bold text-brand-dark">
            {row.receiptPublic ? 'Đang công khai ảnh hoá đơn, bấm để ẩn' : 'Cho thành viên xem ảnh hoá đơn'}
          </button>
        </ActionForm>
      )}
      {voided ? <p className="mt-1 text-xs font-bold text-danger">Đã huỷ: {row.voidReason}</p> : <VoidForm id={row.id} />}
    </li>
  )
}

export default function FundTransactionsList({ rows }: { rows: FundTransactionRow[] }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">Giao dịch gần đây</h2>
      {rows.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có giao dịch nào.</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {rows.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </ul>
    </section>
  )
}
