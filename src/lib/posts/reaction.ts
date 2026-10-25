export type ReactionState = { mine: boolean; count: number }

// Cập nhật tức thì trên giao diện trước khi máy chủ trả lời
export function toggleReaction(state: ReactionState): ReactionState {
  if (state.mine) return { mine: false, count: Math.max(0, state.count - 1) }
  return { mine: true, count: state.count + 1 }
}

export function totalReactions(counts: Record<string, number | undefined>): number {
  return Object.values(counts).reduce<number>((sum, value) => sum + (value ?? 0), 0)
}
