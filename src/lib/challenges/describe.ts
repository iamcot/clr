import { GOAL_TYPE_LABELS, KM_GOAL_TYPES, type GoalType } from '@/config/challenges'
import { formatFixed, formatNumber } from '@/lib/format/number'

// Mục tiêu hiển thị theo đơn vị người đọc hiểu: km, m, ngày hoặc buổi
export function formatGoal(goalType: GoalType, goalValue: number): string {
  if (KM_GOAL_TYPES.includes(goalType)) return `${formatNumber(goalValue / 1000, 1)} km`
  if (goalType === 'total_elevation') return `${formatNumber(goalValue)} m`
  if (goalType === 'active_days') return `${goalValue} ngày`
  return `${goalValue} buổi`
}

export function formatProgressValue(goalType: GoalType, value: number): string {
  if (KM_GOAL_TYPES.includes(goalType)) return `${formatFixed(value / 1000, 1)} km`
  return formatGoal(goalType, Math.round(value))
}

export function describeGoal(goalType: GoalType, goalValue: number): string {
  if (goalType === 'single_distance') return `Có ít nhất một buổi dài từ ${formatGoal(goalType, goalValue)}`
  return `${GOAL_TYPE_LABELS[goalType]} đạt ${formatGoal(goalType, goalValue)}`
}
