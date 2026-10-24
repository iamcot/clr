import { CLUB_POINT_WEIGHTS, LEVEL_RULES, type LevelRule } from '@/config/levels'

export type LevelInput = {
  distanceMeters: number
  activeDays: number
  completedChallenges: number
  prDistanceNames: readonly string[]
}

export type LevelConfig = {
  rules: readonly LevelRule[]
  weights: Record<keyof typeof CLUB_POINT_WEIGHTS, number>
}

const DEFAULT_CONFIG: LevelConfig = { rules: LEVEL_RULES, weights: CLUB_POINT_WEIGHTS }
const METERS_PER_KM = 1000

function meetsRule(input: LevelInput, rule: LevelRule): boolean {
  return (
    input.distanceMeters >= rule.minDistanceMeters &&
    input.activeDays >= rule.minActiveDays &&
    rule.requiredPrs.every((name) => input.prDistanceNames.includes(name))
  )
}

// Level cao nhất mà thành viên đáp ứng đủ điều kiện; luôn có ít nhất level thấp nhất
export function computeLevel(input: LevelInput, config: LevelConfig = DEFAULT_CONFIG): number {
  const sorted = [...config.rules].sort((a, b) => b.level - a.level)
  const lowest = sorted[sorted.length - 1]?.level ?? 1
  return sorted.find((rule) => meetsRule(input, rule))?.level ?? lowest
}

export function computeClubPoints(input: LevelInput, config: LevelConfig = DEFAULT_CONFIG): number {
  const { weights } = config
  const points =
    (input.distanceMeters / METERS_PER_KM) * weights.perKm +
    input.activeDays * weights.perActiveDay +
    input.completedChallenges * weights.perCompletedChallenge
  return Math.round(points)
}

export function levelName(level: number, rules: readonly LevelRule[] = LEVEL_RULES): string {
  return rules.find((rule) => rule.level === level)?.name ?? `Level ${level}`
}
