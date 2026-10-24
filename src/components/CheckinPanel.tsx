'use client'

import { useEffect, useState } from 'react'
import CopyButton from '@/components/CopyButton'
import { loadCheckinCode, type CheckinCode } from '@/lib/events/adminActions'

const REFRESH_MARGIN_MS = 300

type CheckinPanelProps = { eventId: string; origin: string; initial: CheckinCode | null }

export default function CheckinPanel({ eventId, origin, initial }: CheckinPanelProps) {
  const [current, setCurrent] = useState(initial)
  const expiresInSeconds = current?.expiresInSeconds ?? 1

  useEffect(() => {
    const timer = setTimeout(async () => setCurrent(await loadCheckinCode(eventId)), expiresInSeconds * 1000 + REFRESH_MARGIN_MS)
    return () => clearTimeout(timer)
  }, [current, eventId, expiresInSeconds])

  if (!current) return <p className="text-muted">Không lấy được mã điểm danh.</p>
  const link = `${origin}/events/${eventId}/checkin?code=${current.code}`
  return (
    <div className="rounded-xl bg-white p-4 text-center">
      <p className="text-sm text-muted">Link điểm danh (đổi mỗi 30 giây)</p>
      <p className="mt-2 font-mono text-2xl font-black tracking-widest">{current.code}</p>
      <p className="mt-2 text-xs break-all text-muted">{link}</p>
      <CopyButton text={link} label="Chép link" />
    </div>
  )
}
