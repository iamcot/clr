export type SummaryEntry = {
  memberId: string
  challengeId: string
  challengeStartsAt: string
  completed: boolean
  excluded: boolean
}

export type MemberSummary = {
  memberId: string
  joined: number
  completed: number
  longestStreak: number
  currentStreak: number
}

const VN_OFFSET_MS = 7 * 3600 * 1000

// Số thứ tự tháng (năm * 12 + tháng) theo giờ Việt Nam
export function monthIndexVn(iso: string): number {
  const date = new Date(new Date(iso).getTime() + VN_OFFSET_MS)
  return date.getUTCFullYear() * 12 + date.getUTCMonth()
}

function streaks(completedMonths: number[], lastMonth: number): { longest: number; current: number } {
  const months = [...new Set(completedMonths)].sort((a, b) => a - b)
  let longest = 0
  let run = 0
  let previous: number | null = null
  for (const month of months) {
    run = previous !== null && month === previous + 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = month
  }
  return { longest, current: previous === lastMonth ? run : 0 }
}

// Chuỗi hiện tại: số tháng liên tiếp hoàn thành tính đến tháng gần nhất có challenge
export function summarizeMembers(entries: SummaryEntry[]): MemberSummary[] {
  const counted = entries.filter((entry) => !entry.excluded)
  if (counted.length === 0) return []
  const lastMonth = Math.max(...counted.map((entry) => monthIndexVn(entry.challengeStartsAt)))

  const byMember = new Map<string, SummaryEntry[]>()
  for (const entry of counted) byMember.set(entry.memberId, [...(byMember.get(entry.memberId) ?? []), entry])

  return [...byMember.entries()].map(([memberId, memberEntries]) => {
    const completedEntries = memberEntries.filter((entry) => entry.completed)
    const { longest, current } = streaks(
      completedEntries.map((entry) => monthIndexVn(entry.challengeStartsAt)),
      lastMonth,
    )
    return {
      memberId,
      joined: new Set(memberEntries.map((entry) => entry.challengeId)).size,
      completed: new Set(completedEntries.map((entry) => entry.challengeId)).size,
      longestStreak: longest,
      currentStreak: current,
    }
  })
}
