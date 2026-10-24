'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import { formatVnd } from '@/lib/format/money'
import { startPayment } from '@/lib/fund/paymentActions'

export type UnpaidPenalty = { id: string; title: string; reason: string; amount: number }

const SUBMIT_BASE = 'min-h-12 w-full rounded-full font-bold disabled:opacity-40'

export default function PayPenaltiesForm({ penalties }: { penalties: UnpaidPenalty[] }) {
  const [selected, setSelected] = useState<string[]>(() => penalties.map((penalty) => penalty.id))
  const total = penalties.filter((penalty) => selected.includes(penalty.id)).reduce((sum, penalty) => sum + penalty.amount, 0)

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <ActionForm action={startPayment} className="mt-3 flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm">
      <p className="font-bold">Chọn khoản muốn nộp</p>
      <ul className="flex flex-col gap-1">
        {penalties.map((penalty) => (
          <li key={penalty.id}>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                name="penalty_ids"
                value={penalty.id}
                checked={selected.includes(penalty.id)}
                onChange={() => toggle(penalty.id)}
                className="size-5 accent-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{penalty.title}</span>
                {penalty.reason && <span className="block truncate text-xs text-muted">{penalty.reason}</span>}
              </span>
              <span className="font-black">{formatVnd(penalty.amount)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-right font-black">Tổng: {formatVnd(total)}</p>
      <button type="submit" name="method" value="bank" disabled={selected.length === 0} className={`${SUBMIT_BASE} bg-brand text-white`}>
        Nộp bằng VietQR
      </button>
      <button
        type="submit"
        name="method"
        value="cash"
        disabled={selected.length === 0}
        className={`${SUBMIT_BASE} border border-line bg-white`}
      >
        Tôi đã nộp tiền mặt cho thủ quỹ
      </button>
    </ActionForm>
  )
}
