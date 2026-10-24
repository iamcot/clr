const DISPLAY_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function formatDateTimeVi(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatDateVi(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso))
}

const VN_OFFSET_MS = 7 * 3600 * 1000

// Giá trị cho <input type="datetime-local"> theo giờ Việt Nam: '2026-11-01T00:00'
export function toVietnamInputValue(iso: string): string {
  return new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString().slice(0, 16)
}

// Ngược lại: đọc giá trị datetime-local (giờ Việt Nam) thành ISO UTC; null nếu sai định dạng
export function fromVietnamInputValue(text: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return null
  const time = Date.parse(`${text}:00+07:00`)
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}
