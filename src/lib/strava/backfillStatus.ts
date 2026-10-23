export type BackfillStatusInput = {
  status: 'pending' | 'done' | 'failed'
  activityCount: number
  cursorBefore: string | null
}

function formatMonthYear(iso: string): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(new Date(iso))
  const month = parts.find((part) => part.type === 'month')?.value
  const year = parts.find((part) => part.type === 'year')?.value
  return `${month}/${year}`
}

export function describeBackfillStatus(input: BackfillStatusInput): string | null {
  if (input.status === 'done') return null
  if (input.status === 'failed') return 'Đồng bộ lịch sử bị gián đoạn, hãy kết nối lại Strava'
  if (!input.cursorBefore) return 'Đang chờ đồng bộ lịch sử hoạt động'
  return `Đang đồng bộ lịch sử: đã có ${input.activityCount} hoạt động, đến ${formatMonthYear(input.cursorBefore)}`
}
