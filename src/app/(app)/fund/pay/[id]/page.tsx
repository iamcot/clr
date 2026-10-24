import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import BackLink from '@/components/BackLink'
import PaymentPanel from '@/components/PaymentPanel'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadPaymentView } from '@/lib/fund/loadPayment'
import { cancelPayment } from '@/lib/fund/paymentActions'
import { isUuid } from '@/lib/storage/uploadRules'

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireActiveMember()
  const { id } = await params
  const payment = isUuid(id) ? await loadPaymentView(id, member.member_code, new Date()) : null
  if (!payment) notFound()
  const closable = payment.status === 'pending' || payment.status === 'cash_pending'

  return (
    <section>
      <BackLink href="/fund">Quỹ</BackLink>
      <h1 className="mb-3 text-2xl font-black">{payment.method === 'cash' ? 'Nộp tiền mặt' : 'Nộp bằng VietQR'}</h1>
      <PaymentPanel
        intentId={payment.id}
        method={payment.method}
        amount={payment.amount}
        note={payment.note}
        qr={payment.qr}
        expiresAt={payment.expiresAt}
        initialStatus={payment.status}
      />
      {closable && (
        <ActionForm action={cancelPayment} className="mt-4">
          <input type="hidden" name="intent_id" value={payment.id} />
          <button type="submit" className="min-h-11 w-full text-sm text-muted underline">
            Huỷ lần nộp này
          </button>
        </ActionForm>
      )}
    </section>
  )
}
