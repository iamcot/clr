import type { ChallengeStatus } from '@/config/challenges'

export type ChallengePhase = 'upcoming' | 'running' | 'ended'

// Trạng thái hiển thị theo thời gian thực, không chờ job chuyển trạng thái chạy
export function challengePhase(status: ChallengeStatus, startsAt: string, endsAt: string, now: Date): ChallengePhase {
  if (status === 'closed' || status === 'finalizing') return 'ended'
  const time = now.getTime()
  if (time > new Date(endsAt).getTime()) return 'ended'
  if (time < new Date(startsAt).getTime()) return 'upcoming'
  return 'running'
}

export function canRegister(
  participation: string,
  status: ChallengeStatus,
  endsAt: string,
  registrationClosesAt: string | null,
  now: Date,
): boolean {
  if (participation !== 'opt_in' || (status !== 'published' && status !== 'running')) return false
  return now.getTime() < new Date(registrationClosesAt ?? endsAt).getTime()
}

const DAY_MS = 24 * 3600 * 1000

export type ProgressSummary = {
  remaining: number
  daysLeft: number
  neededPerDay: number | null
}

// Còn thiếu bao nhiêu và cần trung bình bao nhiêu mỗi ngày (chỉ có nghĩa với mục tiêu cộng dồn)
export function summarizeProgress(
  goalValue: number,
  value: number,
  endsAt: string,
  now: Date,
  isCumulative: boolean,
): ProgressSummary {
  const remaining = Math.max(0, goalValue - value)
  const daysLeft = Math.max(0, Math.ceil((new Date(endsAt).getTime() - now.getTime()) / DAY_MS))
  const neededPerDay = isCumulative && daysLeft > 0 ? remaining / daysLeft : null
  return { remaining, daysLeft, neededPerDay }
}
