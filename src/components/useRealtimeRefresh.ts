'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

const REFRESH_DEBOUNCE_MS = 1500

// Có thay đổi ở bảng (lọc theo một cột) thì tải lại dữ liệu server của trang, gom các thay đổi dồn dập thành một lần
export function useRealtimeRefresh(table: string, filter: string) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`${table}-${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS)
      })
      .subscribe()
    return () => {
      if (timer.current) clearTimeout(timer.current)
      void supabase.removeChannel(channel)
    }
  }, [table, filter, router])
}
