import { TRANSFER_NOTE_PREFIX, type PenaltyStatus } from '@/config/penalties'

const VN_OFFSET_MS = 7 * 3600 * 1000
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

export type MonthRange = { from: string; to: string }

// Tháng 'YYYY-MM' theo giờ Việt Nam thành khoảng UTC [from, to)
export function monthRangeVn(month: string): MonthRange | null {
  const match = MONTH_PATTERN.exec(month)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const toIso = (y: number, m: number) => new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS).toISOString()
  return { from: toIso(year, monthIndex), to: toIso(year, monthIndex + 1) }
}

export function currentMonthVn(now: Date): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 7)
}

export type PenaltyAmountRow = { amount: number; status: PenaltyStatus }

export type PenaltyTotals = {
  collected: number
  outstanding: number
  waived: number
}

export function summarizePenalties(rows: readonly PenaltyAmountRow[]): PenaltyTotals {
  const totals: PenaltyTotals = { collected: 0, outstanding: 0, waived: 0 }
  for (const row of rows) {
    if (row.status === 'paid') totals.collected += row.amount
    if (row.status === 'unpaid') totals.outstanding += row.amount
    if (row.status === 'waived') totals.waived += row.amount
  }
  return totals
}

// Nội dung chuyển khoản gợi ý: CLR0123 PHAT T11
export function transferNote(memberCode: string, now: Date): string {
  const month = Number(currentMonthVn(now).slice(5))
  return `${memberCode} ${TRANSFER_NOTE_PREFIX} T${month}`
}
