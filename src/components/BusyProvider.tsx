'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import TopProgressBar from '@/components/TopProgressBar'

type BusyRegistry = { start: () => void; stop: () => void }

const BusyContext = createContext<BusyRegistry>({ start: () => {}, stop: () => {} })

// Gọi trong component có thao tác đang chạy; thanh tiến trình trên đầu trang hiện khi còn bất kỳ thao tác nào
export function useBusyIndicator(pending: boolean) {
  const { start, stop } = useContext(BusyContext)
  useEffect(() => {
    if (!pending) return
    start()
    return stop
  }, [pending, start, stop])
}

export default function BusyProvider({ children }: { children: React.ReactNode }) {
  const [busyCount, setBusyCount] = useState(0)
  const registry = useMemo(
    () => ({
      start: () => setBusyCount((count) => count + 1),
      stop: () => setBusyCount((count) => count - 1),
    }),
    [],
  )

  return (
    <BusyContext value={registry}>
      {busyCount > 0 && <TopProgressBar />}
      {children}
    </BusyContext>
  )
}
