export type DrawParticipant = { memberId: string; weight: number }
export type DrawPrize = { id: string; quantity: number; sort: number }
export type DrawPick = { order: number; prizeId: string; memberId: string }

// PRNG nhỏ, đủ đều cho quay số và tái lập được từ một số 32 bit
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function listPrizeSlots(prizes: DrawPrize[]): string[] {
  const ordered = [...prizes].sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
  return ordered.flatMap((prize) => Array.from({ length: prize.quantity }, () => prize.id))
}

function pickIndexByWeight(candidates: DrawParticipant[], random: () => number): number {
  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
  let threshold = random() * totalWeight
  for (const [index, candidate] of candidates.entries()) {
    threshold -= candidate.weight
    if (threshold < 0) return index
  }
  return candidates.length - 1
}

// Sắp xếp đầu vào cố định (theo memberId, giải theo sort) nên cùng seed + cùng danh sách luôn ra cùng kết quả
export function pickWinners(
  participants: DrawParticipant[],
  prizes: DrawPrize[],
  seedNumber: number,
  onePrizePerMember: boolean,
): DrawPick[] {
  const random = mulberry32(seedNumber)
  const pool = [...participants].sort((a, b) => a.memberId.localeCompare(b.memberId))
  const picks: DrawPick[] = []

  for (const prizeId of listPrizeSlots(prizes)) {
    if (pool.length === 0) break
    const index = pickIndexByWeight(pool, random)
    const winner = pool[index]
    if (!winner) break
    picks.push({ order: picks.length + 1, prizeId, memberId: winner.memberId })
    if (onePrizePerMember) pool.splice(index, 1)
  }
  return picks
}

export function countPrizeSlots(prizes: DrawPrize[]): number {
  return prizes.reduce((sum, prize) => sum + prize.quantity, 0)
}
