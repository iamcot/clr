import { hashUnit } from '@/lib/draw/stage'

type DrawCelebrationProps = {
  prizeName: string
  winnerName: string
  waitingNext: boolean
}

const CONFETTI = ['🎉', '✨', '🎊', '⭐', '🏆']
const CONFETTI_COUNT = 14

function confettiStyle(index: number) {
  return {
    left: `${Math.floor(hashUnit(`confetti:${index}:x`) * 92)}%`,
    animationDelay: `${(hashUnit(`confetti:${index}:t`) * 1.6).toFixed(2)}s`,
    animationDuration: `${(2.4 + hashUnit(`confetti:${index}:d`) * 1.6).toFixed(2)}s`,
  }
}

export default function DrawCelebration({ prizeName, winnerName, waitingNext }: DrawCelebrationProps) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl bg-deep px-4 py-10 text-center text-white">
      {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
        <span
          key={index}
          className="absolute top-0 animate-[confetti-fall_3s_ease-in_infinite] text-xl"
          style={confettiStyle(index)}
          aria-hidden
        >
          {CONFETTI[index % CONFETTI.length]}
        </span>
      ))}
      <div className="animate-[celebrate-pop_0.6s_ease-out]">
        <p className="text-lg font-bold text-lime">Chúc mừng thắng giải</p>
        <p className="mt-1 text-2xl font-black">{prizeName}</p>
        <p className="mt-4 text-4xl leading-tight font-black break-words">{winnerName}</p>
      </div>
      {waitingNext && <p className="mt-6 text-sm text-white/70">Chờ BCN quay giải tiếp theo</p>}
    </div>
  )
}
