const VN_OFFSET_MS = 7 * 3600 * 1000
const SHORT_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const LONG_WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function vietnamParts(iso: string) {
  const local = new Date(Date.parse(iso) + VN_OFFSET_MS)
  return {
    weekday: local.getUTCDay(),
    day: local.getUTCDate(),
    month: local.getUTCMonth() + 1,
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function formatClock(iso: string): string {
  const { hour, minute } = vietnamParts(iso)
  return `${hour}:${pad2(minute)}`
}

// Ô lịch nhỏ trên thẻ event: CN / 26 / Th10
export function formatDateTile(iso: string): { weekday: string; day: string; month: string } {
  const parts = vietnamParts(iso)
  return { weekday: SHORT_WEEKDAYS[parts.weekday] ?? '', day: String(parts.day), month: `Th${parts.month}` }
}

// 'Chủ nhật, 26/10 · 5:15 - 7:00'
export function formatEventSchedule(startsAt: string, endsAt: string): string {
  const parts = vietnamParts(startsAt)
  const date = `${LONG_WEEKDAYS[parts.weekday]}, ${pad2(parts.day)}/${pad2(parts.month)}`
  return `${date} · ${formatClock(startsAt)} - ${formatClock(endsAt)}`
}

export function formatEventStart(startsAt: string, locationName: string): string {
  return locationName ? `${formatClock(startsAt)} · ${locationName}` : formatClock(startsAt)
}
