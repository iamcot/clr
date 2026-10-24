'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import CopyButton from '@/components/CopyButton'
import { INTENT_STATUS_LABELS, PAYMENT_POLL_MS, type IntentStatus } from '@/config/fund'
import { formatVnd } from '@/lib/format/money'
import type { PaymentQr } from '@/lib/fund/loadPayment'

type PaymentPanelProps = {
  intentId: string
  method: 'bank' | 'cash'
  amount: number
  note: string
  qr: PaymentQr | null
  expiresAt: string
  initialStatus: IntentStatus
}

const QR_IMAGE_SIZE_PX = 512
const OPEN_STATUSES: IntentStatus[] = ['pending', 'cash_pending', 'mismatch']

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function useIntentStatus(intentId: string, initial: IntentStatus): IntentStatus {
  const [status, setStatus] = useState(initial)
  useEffect(() => {
    if (!OPEN_STATUSES.includes(status)) return
    const timer = setInterval(async () => {
      const response = await fetch(`/api/fund/intents/${intentId}`, { cache: 'no-store' }).catch(() => null)
      if (!response?.ok) return
      const body = (await response.json()) as { status: IntentStatus }
      setStatus(body.status)
    }, PAYMENT_POLL_MS)
    return () => clearInterval(timer)
  }, [intentId, status])
  return status
}

function useCountdown(expiresAt: string, active: boolean): string {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const timer = active ? setInterval(tick, 1000) : undefined
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [active])
  return now === null ? '' : formatCountdown(Date.parse(expiresAt) - now)
}

function useQrImage(payload: string | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!payload) return
    let cancelled = false
    QRCode.toDataURL(payload, { width: QR_IMAGE_SIZE_PX, margin: 2 }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [payload])
  return dataUrl
}

async function saveQrImage(dataUrl: string, fileName: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => undefined)
    return
  }
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  link.click()
}

function PaidNotice({ amount }: { amount: number }) {
  return (
    <div className="rounded-2xl bg-lime/30 p-6 text-center">
      <p className="text-4xl">🎉</p>
      <p className="mt-2 text-xl font-black text-brand-dark">Đã nhận tiền</p>
      <p className="text-muted">{formatVnd(amount)} đã được ghi nhận vào quỹ</p>
    </div>
  )
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate font-bold">{value}</p>
      </div>
      <CopyButton text={value} label="Sao chép" />
    </div>
  )
}

export default function PaymentPanel({ intentId, method, amount, note, qr, expiresAt, initialStatus }: PaymentPanelProps) {
  const status = useIntentStatus(intentId, initialStatus)
  const qrImage = useQrImage(qr?.payload)
  const countdown = useCountdown(expiresAt, status === 'pending')

  if (status === 'paid') return <PaidNotice amount={amount} />
  if (method === 'cash') {
    return (
      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
        <p className="text-2xl font-black">{formatVnd(amount)}</p>
        <p className="mt-2 text-muted">Đã gửi yêu cầu. Đưa tiền mặt cho thủ quỹ, thủ quỹ xác nhận xong khoản phạt sẽ chuyển sang đã nộp.</p>
        <p className="mt-2 text-sm font-bold">{INTENT_STATUS_LABELS[status]}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
        <p className="text-sm text-muted">Số tiền cần chuyển</p>
        <p className="text-3xl font-black">{formatVnd(amount)}</p>
        {qr && qrImage && (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh QR sinh tại chỗ dạng data URL
          <img src={qrImage} alt="Mã VietQR nộp phạt" width={QR_IMAGE_SIZE_PX} height={QR_IMAGE_SIZE_PX} className="mx-auto mt-3 w-full max-w-72" />
        )}
        {!qr && <p className="mt-3 text-sm text-danger">BCN chưa cài tài khoản nhận tiền cho quỹ, hãy hỏi BCN.</p>}
        {qr && qrImage && (
          <button
            type="button"
            onClick={() => void saveQrImage(qrImage, `clr-nop-phat-${note.replace(/\s+/g, '-')}.png`)}
            className="mt-3 min-h-11 rounded-full border border-brand px-5 font-bold text-brand-dark"
          >
            Lưu ảnh QR
          </button>
        )}
        {status === 'pending' && (
          <p className="mt-3 text-sm text-muted" suppressHydrationWarning>
            Mã hết hạn sau {countdown}
          </p>
        )}
        {status === 'expired' && <p className="mt-3 text-sm font-bold text-danger">Mã đã hết hạn, hãy tạo mã mới.</p>}
        {status === 'mismatch' && (
          <p className="mt-3 text-sm font-bold text-danger">
            Số tiền chuyển chưa khớp, thủ quỹ sẽ kiểm tra và xử lý.
          </p>
        )}
      </div>
      {qr && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <AccountRow label={qr.bankName || 'Ngân hàng'} value={qr.accountNo} />
          <p className="text-sm text-muted">Chủ tài khoản: {qr.accountName}</p>
          <AccountRow label="Nội dung chuyển khoản (giữ nguyên)" value={note} />
        </div>
      )}
      {status === 'pending' && <p className="text-center text-sm text-muted">Trang tự báo khi tiền về, không cần tải lại.</p>}
    </div>
  )
}
