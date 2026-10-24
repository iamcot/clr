'use client'

import { useEffect, useState } from 'react'

const SERVICE_WORKER_URL = '/sw.js'

function watchForUpdate(registration: ServiceWorkerRegistration, onUpdate: (worker: ServiceWorker) => void) {
  if (registration.waiting && navigator.serviceWorker.controller) onUpdate(registration.waiting)
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) onUpdate(installing)
    })
  })
}

export default function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    const version = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev'
    navigator.serviceWorker
      .register(`${SERVICE_WORKER_URL}?v=${encodeURIComponent(version)}`)
      .then((registration) => watchForUpdate(registration, setWaitingWorker))
      .catch((error) => console.error('Không đăng ký được service worker', error))

    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })
  }, [])

  if (!waitingWorker) return null
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-[448px] items-center gap-3 rounded-lg bg-deep p-3 text-white shadow-lg">
      <p className="flex-1 text-sm font-bold">Có bản mới</p>
      <button
        type="button"
        onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })}
        className="min-h-11 rounded-lg bg-lime px-4 font-bold text-ink"
      >
        Tải lại
      </button>
    </div>
  )
}
