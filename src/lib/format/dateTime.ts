const DISPLAY_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function formatDateTimeVi(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: DISPLAY_TIME_ZONE }).format(
    new Date(iso),
  )
}

export function formatDateVi(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: DISPLAY_TIME_ZONE }).format(new Date(iso))
}
