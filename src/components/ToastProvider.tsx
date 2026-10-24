'use client'

import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { FLASH_COOKIE_NAME, TOAST_DURATION_MS, type ToastMessage } from '@/config/toasts'
import { parseFlashCode } from '@/lib/toast/flash'

type ToastEntry = ToastMessage & { id: number }

const ToastContext = createContext<(toast: ToastMessage) => void>(() => {})

export const useToast = () => useContext(ToastContext)

function takeFlashCookie(): string | undefined {
  const pair = document.cookie.split('; ').find((item) => item.startsWith(`${FLASH_COOKIE_NAME}=`))
  if (!pair) return undefined
  document.cookie = `${FLASH_COOKIE_NAME}=; path=/; max-age=0`
  return pair.slice(FLASH_COOKIE_NAME.length + 1)
}

function ToastItem({ toast, onDone }: { toast: ToastEntry; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(toast.id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  const colorClass = toast.kind === 'success' ? 'bg-brand' : 'bg-danger'
  return (
    <button
      type="button"
      onClick={() => onDone(toast.id)}
      className={`pointer-events-auto w-full rounded-lg px-4 py-3 text-left text-sm font-bold text-white shadow-lg ${colorClass}`}
    >
      {toast.text}
    </button>
  )
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const pathname = usePathname()

  const show = useCallback((toast: ToastMessage) => {
    setToasts((current) => [...current, { ...toast, id: Date.now() + Math.random() }])
  }, [])
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])

  useEffect(() => {
    const flash = parseFlashCode(takeFlashCookie())
    if (flash) queueMicrotask(() => show(flash))
  }, [pathname, show])

  const contextValue = useMemo(() => show, [show])

  return (
    <ToastContext value={contextValue}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-[480px] flex-col gap-2 p-3"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDone={dismiss} />
        ))}
      </div>
    </ToastContext>
  )
}
