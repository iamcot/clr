import {
  AGE_GROUPS,
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
  birthYear: number | null
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

export function ageGroupOf(birthYear: number | null, raceDate: string): string | null {
  if (birthYear === null) return null
  const age = Number(raceDate.slice(0, 4)) - birthYear
  return AGE_GROUPS.find((group) => age >= group.minAge && age <= group.maxAge)?.key ?? null
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

// ageGroupKey null là xếp chung mọi lứa tuổi
export function buildClubRecords(results: RecordResult[], ageGroupKey: string | null = null): RecordTable[] {
  const inGroup = ageGroupKey ? results.filter((result) => ageGroupOf(result.birthYear, result.raceDate) === ageGroupKey) : results
  return RECORD_DISTANCES.flatMap((distance) =>
    RECORD_GENDERS.map((gender) => ({
      distanceKey: distance.key,
      distanceLabel: distance.label,
      genderKey: gender.key,
      genderLabel: gender.label,
      entries: bestPerMember(resultsOf(inGroup, distance.key, gender.key))
        .slice(0, RECORD_TOP_N)
        .map((result, index) => ({ ...result, rank: index + 1 })),
    })),
  )
}

export type RecordCheck = 'record' | 'result_missing' | 'no_gender' | 'unknown_distance' | 'not_faster'

// Kết quả vừa xác minh là kỷ lục mới khi nhanh hơn mọi kết quả khác cùng cự ly và giới tính
export function checkNewClubRecord(results: RecordResult[], resultId: string): RecordCheck {
  const target = results.find((result) => result.id === resultId)
  if (!target) return 'result_missing'
  const distanceKey = classifyDistance(target.distanceMeters)
  if (!distanceKey) return 'unknown_distance'
  if (!target.gender || !RECORD_GENDERS.some((gender) => gender.key === target.gender)) return 'no_gender'
  const others = resultsOf(results, distanceKey, target.gender).filter((result) => result.id !== resultId)
  return others.every((other) => target.chipTimeSeconds < other.chipTimeSeconds) ? 'record' : 'not_faster'
}

export function isNewClubRecord(results: RecordResult[], resultId: string): boolean {
  return checkNewClubRecord(results, resultId) === 'record'
}

// Người đang giữ hạng 1 của từng cự ly × giới tính (mọi lứa tuổi)
export function listRecordHolders(results: RecordResult[]): RecordResult[] {
  return buildClubRecords(results).flatMap((table) => (table.entries[0] ? [table.entries[0]] : []))
}
