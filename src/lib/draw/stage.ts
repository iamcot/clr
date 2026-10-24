import { WINNER_REVEAL_LEAD_MS } from '@/config/draw'

const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619
const UINT32_RANGE = 4294967296

// Số ngẫu nhiên cố định theo khoá, dùng chung cho mọi máy nên mọi người thấy cùng một hiệu ứng
export function hashUnit(key: string): number {
  let hash = FNV_OFFSET
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), FNV_PRIME) >>> 0
  }
  return hash / UINT32_RANGE
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function easeOutCubic(progress: number): number {
  return 1 - (1 - clamp01(progress)) ** 3
}

export function easeInOutCubic(progress: number): number {
  const value = clamp01(progress)
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
}

// Tiến độ 0..1 của lượt quay theo đồng hồ server
export function spinProgress(nowMs: number, startedAtMs: number, revealAtMs: number): number {
  return clamp01((nowMs - startedAtMs) / (revealAtMs - startedAtMs))
}

// Server chỉ trả người trúng khi còn WINNER_REVEAL_LEAD_MS nữa tới reveal_at
export function isWinnerRevealable(nowMs: number, revealAtMs: number): boolean {
  return nowMs >= revealAtMs - WINNER_REVEAL_LEAD_MS
}

const PACK_START = 0.12
const PACK_DRIFT = 0.62
const PACK_MAX = 0.93
const WOBBLE_MIN_AMPLITUDE = 0.07
const WOBBLE_AMPLITUDE_RANGE = 0.1
const WOBBLE_MIN_WAVES = 2
const WOBBLE_WAVE_RANGE = 4

// Vị trí 0..1 trên đường đua khi chưa biết ai thắng: cả đoàn trôi về phía trước, mỗi người lắc lư riêng nên liên tục vượt nhau
export function packPosition(key: string, progress: number): number {
  const amplitude = WOBBLE_MIN_AMPLITUDE + WOBBLE_AMPLITUDE_RANGE * hashUnit(`${key}:a`)
  const waves = WOBBLE_MIN_WAVES + WOBBLE_WAVE_RANGE * hashUnit(`${key}:f`)
  const phase = hashUnit(`${key}:p`)
  const wobble = amplitude * Math.sin(2 * Math.PI * (waves * progress + phase))
  return Math.min(PACK_MAX, Math.max(0, PACK_START + PACK_DRIFT * progress + wobble))
}

// Sau khi biết người trúng, người đó bứt tốc từ vị trí hiện tại về đích (1) đúng lúc kết thúc; liền mạch tại dashStart
export function winnerPosition(key: string, progress: number, dashStartProgress: number): number {
  const pack = packPosition(key, progress)
  if (progress <= dashStartProgress) return pack
  const dash = easeInOutCubic((progress - dashStartProgress) / (1 - dashStartProgress))
  return pack * (1 - dash) + dash
}

export type ReelLayout = { offsetPx: number; winnerIndex: number | null }

type ReelInput = {
  nowMs: number
  startedAtMs: number
  revealAtMs: number
  winnerSeenAtMs: number | null
  itemHeightPx: number
  speedPxPerMs: number
}

// Cuộn đều trong lúc chưa biết người trúng; khi biết thì giảm tốc, dừng đúng ô giữa tại revealAt.
// Ô i nằm ở hàng giữa khi offset = (i - 1) * chiều cao ô
export function reelLayout({ nowMs, startedAtMs, revealAtMs, winnerSeenAtMs, itemHeightPx, speedPxPerMs }: ReelInput): ReelLayout {
  const constantOffset = (atMs: number) => speedPxPerMs * Math.max(0, atMs - startedAtMs)
  if (winnerSeenAtMs === null) return { offsetPx: constantOffset(nowMs), winnerIndex: null }

  const seenAtMs = Math.min(winnerSeenAtMs, revealAtMs)
  const seenOffset = constantOffset(seenAtMs)
  const remainingMs = Math.max(1, revealAtMs - seenAtMs)
  // easeOutCubic có tốc độ đầu gấp 3 tốc độ trung bình nên quãng đường còn lại = v * T / 3 để khỏi giật tại lúc nối
  const winnerIndex = Math.round((seenOffset + (speedPxPerMs * remainingMs) / 3) / itemHeightPx) + 1
  const finalOffset = (winnerIndex - 1) * itemHeightPx
  if (nowMs <= seenAtMs) return { offsetPx: constantOffset(nowMs), winnerIndex }
  const progress = (nowMs - seenAtMs) / remainingMs
  return { offsetPx: seenOffset + (finalOffset - seenOffset) * easeOutCubic(progress), winnerIndex }
}

// Tên đệm cho ô không phải người trúng: cố định theo lượt quay và số thứ tự ô
export function reelFillerName(names: string[], order: number, index: number): string {
  if (names.length === 0) return ''
  return names[Math.floor(hashUnit(`${order}:${index}`) * names.length)] ?? ''
}
