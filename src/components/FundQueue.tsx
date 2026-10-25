import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import Badge from '@/components/admin/Badge'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import { BANK_EVENT_STATUS_LABELS } from '@/config/fund'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import { classifyFundTransaction, confirmCashPayment, resolveBankEvent } from '@/lib/fund/adminActions'
import type { CashRequest, FundCategory, OpenIntent, QueuedEvent } from '@/lib/fund/loadAdminFund'

type QueueProps = { queue: QueuedEvent[]; openIntents: OpenIntent[]; cashRequests: CashRequest[]; categories: FundCategory[] }

function MatchForm({ event, openIntents }: { event: QueuedEvent; openIntents: OpenIntent[] }) {
  const options = openIntents.filter((intent) => intent.status !== 'cash_pending')
  if (options.length === 0) return null
  return (
    <ActionForm action={resolveBankEvent} className="mt-2 flex gap-2">
      <input type="hidden" name="event_id" value={event.id} />
      <select name="intent_id" defaultValue="" required className={ADMIN_INPUT_CLASS}>
        <option value="" disabled>
          Ghép với lần nộp
        </option>
        {options.map((intent) => (
          <option key={intent.id} value={intent.id}>
            {intent.memberName} · {formatVndCompact(intent.amount)} · {intent.ref}
          </option>
        ))}
      </select>
      <button type="submit" className={adminButtonClass('secondary')}>
        Ghép
      </button>
    </ActionForm>
  )
}

function ClassifyForm({ event, categories }: { event: QueuedEvent; categories: FundCategory[] }) {
  if (!event.transactionId) return null
  return (
    <ActionForm action={classifyFundTransaction} className="mt-2 flex gap-2">
      <input type="hidden" name="id" value={event.transactionId} />
      <select name="category_id" defaultValue="" required className={ADMIN_INPUT_CLASS}>
        <option value="" disabled>
          Phân loại khoản thu
        </option>
        {categories
          .filter((category) => category.direction === 'in')
          .map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
      </select>
      <button type="submit" className={adminButtonClass('secondary')}>
        Lưu
      </button>
    </ActionForm>
  )
}

function QueueItem({ event, openIntents, categories }: { event: QueuedEvent; openIntents: OpenIntent[]; categories: FundCategory[] }) {
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-black">{formatVndCompact(event.amount)}</p>
        <Badge tone="danger">{BANK_EVENT_STATUS_LABELS[event.status]}</Badge>
      </div>
      <p className="mt-1 text-sm break-words">{event.content || '(không có nội dung)'}</p>
      <p className="text-xs text-muted">
        {formatDateTimeVi(event.transferredAt)}
        {event.matchedRef && ` · mã ${event.matchedRef}`}
        {event.suggestedMemberName && ` · gợi ý ${event.suggestedMemberName}`}
      </p>
      <MatchForm event={event} openIntents={openIntents} />
      {event.status !== 'mismatch' && <ClassifyForm event={event} categories={categories} />}
    </li>
  )
}

export default function FundQueue({ queue, openIntents, cashRequests, categories }: QueueProps) {
  const count = queue.length + cashRequests.length
  return (
    <AdminCard title={`Cần xử lý (${count})`}>
      {count === 0 && <p className="text-sm text-muted">Không có giao dịch nào cần xử lý.</p>}
      <ul className="divide-y divide-hairline">
        {cashRequests.map((request) => (
          <li key={request.id} className="py-3">
            <p className="font-bold">
              {request.memberName} báo đã nộp tiền mặt {formatVndCompact(request.amount)}
            </p>
            <p className="text-xs text-muted">{formatDateTimeVi(request.createdAt)}</p>
            <ActionForm action={confirmCashPayment} className="mt-2">
              <input type="hidden" name="intent_id" value={request.id} />
              <button type="submit" className={adminButtonClass('primary')}>
                Xác nhận đã nhận tiền mặt
              </button>
            </ActionForm>
          </li>
        ))}
        {queue.map((event) => (
          <QueueItem key={event.id} event={event} openIntents={openIntents} categories={categories} />
        ))}
      </ul>
    </AdminCard>
  )
}
