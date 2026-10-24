import { REEL_ITEM_HEIGHT_PX, REEL_SPEED_PX_PER_MS } from '@/config/draw'
import type { SpinningView } from '@/lib/draw/loadDraw'
import { reelFillerName, reelLayout } from '@/lib/draw/stage'

type DrawReelStageProps = {
  spinning: SpinningView
  names: string[]
  nowMs: number
  winnerSeenAtMs: number | null
}

const VISIBLE_ROWS = 3
const ROWS_BEFORE = 1
const ROWS_AFTER = 2

export default function DrawReelStage({ spinning, names, nowMs, winnerSeenAtMs }: DrawReelStageProps) {
  const { offsetPx, winnerIndex } = reelLayout({
    nowMs,
    startedAtMs: spinning.startedAtMs,
    revealAtMs: spinning.revealAtMs,
    winnerSeenAtMs,
    itemHeightPx: REEL_ITEM_HEIGHT_PX,
    speedPxPerMs: REEL_SPEED_PX_PER_MS,
  })
  const firstIndex = Math.floor(offsetPx / REEL_ITEM_HEIGHT_PX) - ROWS_BEFORE
  const indexes = Array.from({ length: VISIBLE_ROWS + ROWS_BEFORE + ROWS_AFTER }, (_, step) => firstIndex + step)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-deep text-white" style={{ height: REEL_ITEM_HEIGHT_PX * VISIBLE_ROWS }}>
      {indexes.map((index) => (
        <p
          key={index}
          className="absolute inset-x-0 flex items-center justify-center truncate px-3 text-xl font-bold"
          style={{ height: REEL_ITEM_HEIGHT_PX, transform: `translateY(${index * REEL_ITEM_HEIGHT_PX - offsetPx}px)` }}
        >
          {index === winnerIndex && spinning.winner ? spinning.winner.name : reelFillerName(names, spinning.order, index)}
        </p>
      ))}
      <div
        className="pointer-events-none absolute inset-x-0 border-y-2 border-lime"
        style={{ top: REEL_ITEM_HEIGHT_PX, height: REEL_ITEM_HEIGHT_PX }}
      />
    </div>
  )
}
