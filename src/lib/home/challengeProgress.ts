import { KM_GOAL_TYPES, type GoalType } from '@/config/challenges'
import { formatGoal } from '@/lib/challenges/describe'
import { formatFixed } from '@/lib/format/number'

const DAY_MS = 24 * 3600 * 1000
const METERS_PER_KM = 1000

export function daysLeft(endsAt: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now.getTime()) / DAY_MS))
}

function formatKmValue(meters: number): string {
  return formatFixed(Math.round(meters / 100) / 10, 1)
}

// 'Còn 7,4 km trong 8 ngày · khoảng 1 km/ngày'; mục tiêu không tính bằng km thì không có phần km/ngày
export function describeRemaining(goalType: GoalType, goalValue: number, value: number, daysRemaining: number): string {
  const remaining = Math.max(0, goalValue - value)
  if (remaining === 0) return 'Bạn đã hoàn thành mục tiêu'
  const timeText = daysRemaining > 0 ? `${daysRemaining} ngày` : 'hôm nay'
  if (!KM_GOAL_TYPES.includes(goalType)) return `Còn ${formatGoal(goalType, Math.ceil(remaining))} trong ${timeText}`
  const base = `Còn ${formatKmValue(remaining)} km trong ${timeText}`
  if (daysRemaining === 0) return base
  const perDayKm = Math.max(1, Math.round(remaining / METERS_PER_KM / daysRemaining))
  return `${base} · khoảng ${perDayKm} km/ngày`
}
