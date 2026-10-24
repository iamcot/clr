export type OwnChallengeEntry = { id: string; title: string; progressPct: number; completed: boolean }
export type OwnPenalty = { amount: number; status: 'unpaid' | 'paid' | 'waived' }

export type ChallengePenaltySummary = {
  joinedCount: number
  completedCount: number
  penaltyCount: number
  unpaidAmount: number
}

// Phạt đã miễn không tính là bị phạt
export function summarizeChallengePenalty(entries: OwnChallengeEntry[], penalties: OwnPenalty[]): ChallengePenaltySummary {
  const charged = penalties.filter((penalty) => penalty.status !== 'waived')
  return {
    joinedCount: entries.length,
    completedCount: entries.filter((entry) => entry.completed).length,
    penaltyCount: charged.length,
    unpaidAmount: charged.filter((penalty) => penalty.status === 'unpaid').reduce((sum, penalty) => sum + penalty.amount, 0),
  }
}
