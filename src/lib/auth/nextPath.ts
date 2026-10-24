export const LOGIN_NEXT_COOKIE = 'clr_login_next'

// Chỉ nhận đường dẫn nội bộ để không bị lợi dụng chuyển hướng ra ngoài
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`
}
