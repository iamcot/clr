'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import CopyButton from '@/components/CopyButton'
import { loadCheckinCode, type CheckinCode } from '@/lib/events/adminActions'
import { buildCheckinLink } from '@/lib/events/checkinLink'

const REFRESH_MARGIN_MS = 300
const QR_SIZE_PX = 256

type CheckinPanelProps = { eventId: string; origin: string; initial: CheckinCode | null }

export default function CheckinPanel({ eventId, origin, initial }: CheckinPanelProps) {
  const [current, setCurrent] = useState(initial)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const expiresInSeconds = current?.expiresInSeconds ?? 1

  useEffect(() => {
    const timer = setTimeout(async () => setCurrent(await loadCheckinCode(eventId)), expiresInSeconds * 1000 + REFRESH_MARGIN_MS)
    return () => clearTimeout(timer)
  }, [current, eventId, expiresInSeconds])

  const link = current ? buildCheckinLink(origin, eventId, current.code) : null

  useEffect(() => {
    if (!link) return
    let cancelled = false
    QRCode.toDataURL(link, { margin: 1, width: QR_SIZE_PX }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [link])

  if (!current || !link) return <p className="text-muted">Không lấy được mã điểm danh.</p>
  return (
    <div className="rounded-xl bg-white shadow-sm p-4 text-center">
      <p className="text-sm text-muted">Cho thành viên quét bằng camera (mã đổi mỗi 30 giây)</p>
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="Mã QR điểm danh" width={QR_SIZE_PX} height={QR_SIZE_PX} className="mx-auto mt-2" />
      )}
      <p className="mt-2 font-mono text-2xl font-black tracking-widest">{current.code}</p>
      <p className="mt-2 text-xs break-all text-muted">{link}</p>
      <CopyButton text={link} label="Chép link" />
    </div>
  )
}
