import { PR_DISTANCES } from '@/config/prDistances'
import { formatDuration } from '@/lib/stats/format'

export type HighlightKind = 'pr' | 'honor' | 'race'

export type HighlightItem = {
  id: string
  memberId: string
  memberName: string
  kind: HighlightKind
  text: string
  date: string
}

const DAY_MS = 24 * 3600 * 1000

export function isWithinDays(isoDate: string, days: number, now: Date): boolean {
  const age = now.getTime() - Date.parse(isoDate)
  return age >= 0 && age <= days * DAY_MS
}

export function describePr(distanceName: string, timeSeconds: number): string {
  const label = PR_DISTANCES.find((distance) => distance.name === distanceName)?.label ?? distanceName
  return `đạt PR ${label}: ${formatDuration(timeSeconds)}`
}

export function describeHonor(title: string): string {
  return `nhận danh hiệu “${title}”`
}

export function describeRace(distanceLabel: string, raceName: string, rankOverall: number | null, rankAgeGroup: number | null): string {
  const podium = [
    rankOverall && rankOverall <= 3 ? `hạng ${rankOverall} toàn giải` : null,
    rankAgeGroup && rankAgeGroup <= 3 ? `hạng ${rankAgeGroup} lứa tuổi` : null,
  ].find((text) => text !== null)
  return podium
    ? `đạt ${podium} ${distanceLabel} tại ${raceName}`
    : `vừa hoàn thành ${distanceLabel} tại ${raceName}`
}

// Mới nhất trước, cắt theo giới hạn
export function mergeHighlights(items: HighlightItem[], limit: number): HighlightItem[] {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
  return sorted.slice(0, limit)
}
