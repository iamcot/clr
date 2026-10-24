// Service worker viết tay. Phiên bản nằm ở query ?v=... khi đăng ký, đổi theo mỗi bản build nên trình duyệt coi là SW mới.
const STATIC_CACHE = 'clr-static'
const PAGES_CACHE = 'clr-pages'
const CACHED_AT_HEADER = 'x-clr-cached-at'
const STATIC_PREFIXES = ['/_next/static/', '/icons/', '/brand/']
const UNCACHED_PAGE_PREFIXES = ['/login', '/api/']

self.addEventListener('install', () => {
  // Không skipWaiting tự động: app hiện "Có bản mới" và chờ người dùng bấm tải lại
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data && event.data.type === 'CLEAR_PAGES') event.waitUntil(caches.delete(PAGES_CACHE))
})

function isStaticAsset(url) {
  return STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

function isCacheablePage(url) {
  return !UNCACHED_PAGE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function withCachedAt(response) {
  const headers = new Headers(response.headers)
  headers.set(CACHED_AT_HEADER, new Date().toISOString())
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers })
}

async function networkFirstPage(request, url) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok && !response.redirected && isCacheablePage(url)) {
      cache.put(request, await withCachedAt(response.clone()))
    }
    return response
  } catch {
    const cached = (await cache.match(request)) || (await cache.match('/'))
    if (cached) return cached
    return new Response('Bạn đang ngoại tuyến và trang này chưa được lưu. Hãy kết nối mạng rồi thử lại.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (request.mode === 'navigate') event.respondWith(networkFirstPage(request, url))
})
