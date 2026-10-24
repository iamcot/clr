'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import CopyButton from '@/components/CopyButton'
import {
  detectInstallEnvironment,
  isInstallPromptDismissed,
  type InstallEnvironment,
} from '@/lib/pwa/installEnvironment'

type InstallPromptEvent = Event & { prompt: () => Promise<void> }

const DISMISSED_AT_KEY = 'clr_install_dismissed_at'

function readDismissedAt(): number | null {
  try {
    const stored = window.localStorage.getItem(DISMISSED_AT_KEY)
    return stored === null ? null : Number(stored)
  } catch {
    return null
  }
}

function writeDismissedAt(timeMs: number) {
  try {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(timeMs))
  } catch {
    // Safari chế độ riêng tư chặn localStorage: thẻ sẽ hiện lại lần sau, chấp nhận được
  }
}

function isStandaloneDisplay(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

function Card({ title, onDismiss, children }: { title: string; onDismiss: () => void; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{title}</p>
        <button type="button" onClick={onDismiss} aria-label="Tắt" className="-mt-2 -mr-2 size-11 text-xl text-muted">
          ×
        </button>
      </div>
      {children}
    </div>
  )
}

function subscribeNothing() {
  return () => {}
}

function readEnvironment(): InstallEnvironment {
  if (isInstallPromptDismissed(readDismissedAt(), Date.now())) return 'installed'
  return detectInstallEnvironment(navigator.userAgent, isStandaloneDisplay())
}

export default function InstallPrompt() {
  const detected = useSyncExternalStore(subscribeNothing, readEnvironment, () => 'installed' as InstallEnvironment)
  const origin = useSyncExternalStore(
    subscribeNothing,
    () => window.location.origin,
    () => '',
  )
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)
  const environment = hidden ? 'installed' : detected

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    const handleInstalled = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  function dismiss() {
    writeDismissedAt(Date.now())
    setHidden(true)
  }

  if (environment === 'installed' || environment === 'unsupported') return null

  if (environment === 'in_app_browser') {
    return (
      <Card title="Mở bằng Safari hoặc Chrome để cài CLR" onDismiss={dismiss}>
        <p className="mt-1 text-sm text-muted">
          Trình duyệt trong Zalo hoặc Facebook không cài được. Sao chép link rồi dán vào Safari (iPhone) hoặc Chrome
          (Android).
        </p>
        <div className="mt-2 flex">
          <CopyButton text={origin} label="Sao chép link" />
        </div>
      </Card>
    )
  }

  if (environment === 'ios_safari') {
    return (
      <Card title="Cài CLR ra màn hình chính" onDismiss={dismiss}>
        <ol className="mt-1 list-decimal pl-5 text-sm">
          <li>Bấm nút Chia sẻ (ô vuông có mũi tên lên) ở thanh dưới của Safari.</li>
          <li>Chọn “Thêm vào MH chính”, rồi bấm Thêm.</li>
        </ol>
      </Card>
    )
  }

  if (!installEvent) return null
  return (
    <Card title="Cài CLR ra màn hình chính" onDismiss={dismiss}>
      <p className="mt-1 text-sm text-muted">Mở nhanh như một ứng dụng, xem được cả khi mạng yếu.</p>
      <button
        type="button"
        onClick={() => void installEvent.prompt()}
        className="mt-2 min-h-11 rounded-lg bg-brand px-4 font-bold text-white active:bg-brand-dark"
      >
        Cài đặt
      </button>
    </Card>
  )
}
