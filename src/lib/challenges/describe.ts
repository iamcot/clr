import { GOAL_TYPE_LABELS, KM_GOAL_TYPES, type GoalType } from '@/config/challenges'

// Mục tiêu hiển thị theo đơn vị người đọc hiểu: km, m, ngày hoặc buổi
export function formatGoal(goalType: GoalType, goalValue: number): string {
  if (KM_GOAL_TYPES.includes(goalType)) return `${goalValue / 1000} km`
  if (goalType === 'total_elevation') return `${goalValue} m`
  if (goalType === 'active_days') return `${goalValue} ngày`
  return `${goalValue} buổi`
}

export function formatProgressValue(goalType: GoalType, value: number): string {
  if (KM_GOAL_TYPES.includes(goalType)) return `${(value / 1000).toFixed(1).replace('.', ',')} km`
  return formatGoal(goalType, Math.round(value))
}

export function describeGoal(goalType: GoalType, goalValue: number): string {
  if (goalType === 'single_distance') return `Có ít nhất một buổi dài từ ${formatGoal(goalType, goalValue)}`
  return `${GOAL_TYPE_LABELS[goalType]} đạt ${formatGoal(goalType, goalValue)}`
}
