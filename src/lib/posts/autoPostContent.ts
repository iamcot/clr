export type ResultCategory = {
  name: string
  participantCount: number
  completedCount: number
  top: { rank: number; name: string; valueText: string }[]
}

export type AutoPostContent = { title: string; bodyMd: string }

function topLines(category: ResultCategory): string[] {
  return category.top.map((entry) => `${entry.rank}. ${entry.name}: ${entry.valueText}`)
}

// Tên người chỉ có trong bài khi CLB cho hiển thị số liệu giữa các thành viên (top rỗng thì chỉ có số lượng)
export function buildChallengeResultPost(
  challengeTitle: string,
  challengeId: string,
  categories: ResultCategory[],
): AutoPostContent {
  const sections = categories.map((category) =>
    [
      `## ${category.name}`,
      `${category.completedCount}/${category.participantCount} người hoàn thành.`,
      ...(category.top.length > 0 ? ['', ...topLines(category)] : []),
    ].join('\n'),
  )
  const bodyMd = [
    `Challenge **${challengeTitle}** đã chốt kết quả.`,
    ...sections,
    `[Xem bảng xếp hạng đầy đủ](/challenges/${challengeId})`,
  ].join('\n\n')
  return { title: `Kết quả ${challengeTitle}`, bodyMd }
}

export type LevelUp = { name: string; levelName: string; level: number }

export function buildLevelDigestPost(levelUps: LevelUp[]): AutoPostContent {
  const lines = levelUps.map((item) => `- ${item.name} lên level ${item.level} (${item.levelName})`)
  return {
    title: 'Chúc mừng các thành viên lên level tuần này',
    bodyMd: ['Chúc mừng các bạn đã lên level trong tuần qua:', lines.join('\n')].join('\n\n'),
  }
}

export type LevelChange = { memberId: string; oldLevel: number; newLevel: number; changedAt: string }

// Mỗi người một dòng: level đầu tuần (trước lần đổi sớm nhất) so với level cuối; chỉ giữ người thực sự lên
export function pickLevelUps(changes: LevelChange[]): { memberId: string; level: number }[] {
  const byMember = new Map<string, LevelChange[]>()
  for (const change of changes) byMember.set(change.memberId, [...(byMember.get(change.memberId) ?? []), change])

  return [...byMember.entries()].flatMap(([memberId, memberChanges]) => {
    const ordered = [...memberChanges].sort((a, b) => a.changedAt.localeCompare(b.changedAt))
    const startLevel = ordered[0]?.oldLevel ?? 0
    const endLevel = ordered[ordered.length - 1]?.newLevel ?? 0
    return endLevel > startLevel ? [{ memberId, level: endLevel }] : []
  })
}
