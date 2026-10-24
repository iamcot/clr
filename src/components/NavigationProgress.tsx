'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const GIVE_UP_AFTER_MS = 15000

function currentLocationKey(): string {
  return window.location.pathname + window.location.search
}

function findInternalLink(event: MouseEvent): HTMLAnchorElement | null {
  if (event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  const link = (event.target as Element | null)?.closest('a')
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return null
  if (link.origin !== window.location.origin) return null
  return link
}

export default function NavigationProgress() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const locationKey = search ? `${pathname}?${search}` : pathname
  const [startedAt, setStartedAt] = useState<string | null>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const link = findInternalLink(event)
      if (!link) return
      const target = link.pathname + link.search
      if (target !== currentLocationKey()) setStartedAt(currentLocationKey())
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    if (startedAt === null) return
    const timer = setTimeout(() => setStartedAt(null), GIVE_UP_AFTER_MS)
    return () => clearTimeout(timer)
  }, [startedAt])

  if (startedAt !== locationKey) return null
  return (
    <div role="progressbar" aria-label="Đang tải trang" className="fixed inset-x-0 top-0 z-[60] h-1 bg-lime/30">
      <div className="nav-progress-bar h-full bg-lime" />
    </div>
  )
}
