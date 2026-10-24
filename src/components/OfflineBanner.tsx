'use client'

import { useEffect, useState } from 'react'

const CACHED_AT_HEADER = 'x-clr-cached-at'
const DISPLAY_TIME_ZONE = 'Asia/Ho_Chi_Minh'

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeStyle: 'short',
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso))
}

// Trang offline do service worker trả từ cache có kèm giờ lưu; đọc lại bằng chính URL hiện tại
async function readCachedAt(): Promise<string | null> {
  try {
    const response = await fetch(window.location.href, {
      headers: { Accept: 'text/html' },
    })
    return response.headers.get(CACHED_AT_HEADER)
  } catch {
    return null
  }
}

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)

  useEffect(() => {
    async function sync() {
      const isOffline = !navigator.onLine
      setOffline(isOffline)
      setCachedAt(isOffline ? await readCachedAt() : null)
    }
    void sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  if (!offline) return null
  return (
    <p role="status" className="bg-gold px-4 py-2 text-center text-sm font-bold text-ink">
      Đang ngoại tuyến{cachedAt ? ` – số liệu lúc ${formatTime(cachedAt)}` : ''}
    </p>
  )
}
