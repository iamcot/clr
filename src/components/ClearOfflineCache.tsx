'use client'

import { useEffect } from 'react'

const PAGES_CACHE = 'clr-pages'

// Trang đăng nhập hiện ra nghĩa là đã đăng xuất hoặc hết phiên: xoá trang cá nhân đã lưu để không lộ dữ liệu trên máy dùng chung
export default function ClearOfflineCache() {
  useEffect(() => {
    if ('caches' in window) void caches.delete(PAGES_CACHE)
  }, [])
  return null
}
