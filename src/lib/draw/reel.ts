// Dãy tên cho hiệu ứng cuộn: tên đệm xác định theo thứ tự giải nên mọi máy thấy cùng một dãy, tên cuối là người trúng
export function buildReelNames(allNames: string[], winnerName: string, order: number, length: number): string[] {
  if (allNames.length === 0) return [winnerName]
  const fillers = Array.from({ length: length - 1 }, (_, index) => {
    const position = (index * 7919 + order * 104729) % allNames.length
    return allNames[position] ?? winnerName
  })
  return [...fillers, winnerName]
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))
  return 1 - (1 - clamped) ** 3
}

// 0 trước khi bắt đầu, 1 khi tới mốc revealAt; nowMs và revealAtMs cùng đồng hồ server
export function reelProgress(nowMs: number, revealAtMs: number, animationMs: number): number {
  return Math.min(1, Math.max(0, (nowMs - (revealAtMs - animationMs)) / animationMs))
}
