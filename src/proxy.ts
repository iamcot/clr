import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

// Trang đọc được khi chưa đăng nhập (trang chủ, challenge, event, thành viên, xếp hạng, bảng vàng, quay số, bài viết, đăng nhập);
// các trang khác và mọi API phải có phiên, trừ những API công khai dưới đây
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/strava/webhook', '/api/bank/webhook', '/api/cron', '/api/draws', '/dev']
const LOGIN_REQUIRED_PAGE_PREFIXES = ['/me', '/fund', '/admin', '/welcome', '/pending', '/photos']
const ADMIN_PREFIX = '/admin'
const ADMIN_LOGIN_PATH = '/admin/login'

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function requiresLogin(pathname: string) {
  if (pathname === ADMIN_LOGIN_PATH) return false
  if (matchesPrefix(pathname, PUBLIC_API_PREFIXES)) return false
  if (pathname.startsWith('/api/')) return true
  return matchesPrefix(pathname, LOGIN_REQUIRED_PAGE_PREFIXES)
}

function loginUrlFor(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (!matchesPrefix(pathname, [ADMIN_PREFIX])) return new URL('/login', request.url)
  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url)
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return loginUrl
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  if (!data?.claims && requiresLogin(request.nextUrl.pathname)) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    return NextResponse.redirect(loginUrlFor(request))
  }
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand/|strava/|icons/|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
}
