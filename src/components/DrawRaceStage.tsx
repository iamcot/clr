import { useMemo } from 'react'
import DrawSprites from '@/components/DrawSprites'
import { FULL_NAMES_MAX_FIELD, LEADER_LABEL_COUNT, WINNER_REVEAL_LEAD_MS } from '@/config/draw'
import type { SpinningView } from '@/lib/draw/loadDraw'
import { hashUnit, packPosition, spinProgress, winnerPosition } from '@/lib/draw/stage'

export type RaceKind = 'runner' | 'duck'

type Racer = { memberId: string; name: string }

type DrawRaceStageProps = {
  kind: RaceKind
  spinning: SpinningView
  racers: Racer[]
  nowMs: number
  winnerSeenAtMs: number | null
}

const LANES = 8
const LANE_GAP_PCT = 9
const LANE_TOP_PCT = 18
const START_PCT = 2
const FINISH_PCT = 86
const HUE_DEGREES = 360
const BIG_SPRITE_PX = 56
const SMALL_SPRITE_PX = 40
const LABEL_FLIP_PCT = 70

const STAGE_BACKGROUND: Record<RaceKind, string> = {
  runner: 'bg-lime/30',
  duck: 'bg-gradient-to-b from-brand/40 via-water to-water-deep',
}

const SPRITE_ID: Record<RaceKind, string> = { runner: '#sprite-runner', duck: '#sprite-duck' }

function racerStyle(memberId: string) {
  return {
    lane: Math.floor(hashUnit(`${memberId}:lane`) * LANES),
    color: `hsl(${Math.floor(hashUnit(`${memberId}:hue`) * HUE_DEGREES)} 75% 50%)`,
    delay: `${(hashUnit(`${memberId}:delay`) * 0.5).toFixed(2)}s`,
  }
}

function FinishLine() {
  return (
    <div
      className="absolute inset-y-0 w-3 opacity-80"
      style={{
        left: `${FINISH_PCT + 6}%`,
        backgroundImage: 'repeating-conic-gradient(var(--color-ink) 0% 25%, white 0% 50%)',
        backgroundSize: '12px 12px',
      }}
    />
  )
}

// Mọi người đều hiện trên đường đua; chưa biết ai thắng thì cả đoàn trôi về trước và vượt nhau, người thắng bứt tốc ở cuối
export default function DrawRaceStage({ kind, spinning, racers, nowMs, winnerSeenAtMs }: DrawRaceStageProps) {
  const styles = useMemo(() => new Map(racers.map((racer) => [racer.memberId, racerStyle(racer.memberId)])), [racers])
  const progress = spinProgress(nowMs, spinning.startedAtMs, spinning.revealAtMs)
  const duration = spinning.revealAtMs - spinning.startedAtMs
  const dashStartMs = Math.max(spinning.revealAtMs - WINNER_REVEAL_LEAD_MS, winnerSeenAtMs ?? 0)
  const dashStartProgress = (dashStartMs - spinning.startedAtMs) / duration
  const winnerId = spinning.winner?.memberId ?? null

  const positioned = racers.map((racer) => ({
    ...racer,
    position:
      racer.memberId === winnerId
        ? winnerPosition(racer.memberId, progress, dashStartProgress)
        : packPosition(racer.memberId, progress),
  }))
  const showAllNames = racers.length <= FULL_NAMES_MAX_FIELD
  const leaders = new Set(
    [...positioned]
      .sort((a, b) => b.position - a.position)
      .slice(0, LEADER_LABEL_COUNT)
      .map((racer) => racer.memberId),
  )
  const spritePx = showAllNames ? BIG_SPRITE_PX : SMALL_SPRITE_PX
  const drawOrder = [...positioned].sort((a, b) => (styles.get(a.memberId)?.lane ?? 0) - (styles.get(b.memberId)?.lane ?? 0))

  return (
    <div className={`relative h-72 overflow-hidden rounded-2xl ${STAGE_BACKGROUND[kind]}`}>
      <DrawSprites />
      <FinishLine />
      {drawOrder.map((racer) => {
        const style = styles.get(racer.memberId)
        if (!style) return null
        const left = START_PCT + (FINISH_PCT - START_PCT) * racer.position
        const labelled = showAllNames || leaders.has(racer.memberId)
        return (
          <div
            key={racer.memberId}
            className="absolute"
            style={{ left: `${left.toFixed(2)}%`, top: `${LANE_TOP_PCT + style.lane * LANE_GAP_PCT}%` }}
          >
            {labelled && (
              <p
                className={`absolute bottom-full max-w-32 truncate rounded px-1 text-xs font-bold whitespace-nowrap ${
                  left > LABEL_FLIP_PCT ? 'right-0' : 'left-1/2 -translate-x-1/2'
                } ${racer.memberId === winnerId ? 'bg-lime text-deep' : 'bg-white/70'}`}
              >
                {racer.name}
              </p>
            )}
            <svg
              viewBox={kind === 'runner' ? '0 0 64 64' : '0 0 64 48'}
              width={spritePx}
              height={kind === 'runner' ? spritePx : (spritePx * 48) / 64}
              style={{ color: style.color, '--d': style.delay } as React.CSSProperties}
              aria-hidden
            >
              <use href={SPRITE_ID[kind]} />
            </svg>
          </div>
        )
      })}
    </div>
  )
}
