import {
  RECORD_DISTANCES,
  RECORD_DISTANCE_TOLERANCE,
  RECORD_GENDERS,
  RECORD_TOP_N,
} from '@/config/hallOfFame'

export type RecordResult = {
  id: string
  memberId: string
  displayName: string
  avatarUrl: string | null
  gender: string | null
  distanceMeters: number
  chipTimeSeconds: number
  raceName: string
  raceDate: string
}

export type RecordEntry = RecordResult & { rank: number }

export type RecordTable = {
  distanceKey: string
  distanceLabel: string
  genderKey: string
  genderLabel: string
  entries: RecordEntry[]
}

export function classifyDistance(distanceMeters: number): string | null {
  const match = RECORD_DISTANCES.find(
    (distance) => Math.abs(distanceMeters - distance.distanceMeters) / distance.distanceMeters <= RECORD_DISTANCE_TOLERANCE,
  )
  return match?.key ?? null
}

function sortByTime(results: RecordResult[]): RecordResult[] {
  return [...results].sort(
    (a, b) => a.chipTimeSeconds - b.chipTimeSeconds || a.raceDate.localeCompare(b.raceDate) || a.id.localeCompare(b.id),
  )
}

// Mỗi thành viên chỉ giữ thành tích tốt nhất của mình trong từng nhóm
function bestPerMember(results: RecordResult[]): RecordResult[] {
  const seen = new Set<string>()
  return sortByTime(results).filter((result) => {
    if (seen.has(result.memberId)) return false
    seen.add(result.memberId)
    return true
  })
}

function resultsOf(results: RecordResult[], distanceKey: string, genderKey: string): RecordResult[] {
  return results.filter((result) => classifyDistance(result.distanceMeters) === distanceKey && result.gender === genderKey)
}

export function buildClubRecords(results: RecordResult[]): RecordTable[] {
  return RECORD_DISTANCES.flatMap((distance) =>
    RECORD_GENDERS.map((gender) => ({
      distanceKey: distance.key,
      distanceLabel: distance.label,
      genderKey: gender.key,
      genderLabel: gender.label,
      entries: bestPerMember(resultsOf(results, distance.key, gender.key))
        .slice(0, RECORD_TOP_N)
        .map((result, index) => ({ ...result, rank: index + 1 })),
    })),
  )
}

// Kết quả vừa xác minh là kỷ lục mới khi nhanh hơn mọi kết quả khác cùng cự ly và giới tính
export function isNewClubRecord(results: RecordResult[], resultId: string): boolean {
  const target = results.find((result) => result.id === resultId)
  if (!target) return false
  const distanceKey = classifyDistance(target.distanceMeters)
  if (!distanceKey || !target.gender) return false
  const others = resultsOf(results, distanceKey, target.gender).filter((result) => result.id !== resultId)
  return others.every((other) => target.chipTimeSeconds < other.chipTimeSeconds)
}
