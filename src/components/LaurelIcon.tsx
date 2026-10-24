type LaurelIconProps = { className?: string }

const CENTER = 12
const RADIUS = 8.2
const START_DEGREES = 105
const END_DEGREES = 238
const LEAF_PAIRS = 6
const LEAF_TILT_DEGREES = 38
const LEAF_PATH = 'M0 0C1.5-1 1.6-3 0-4.4C-1.6-3-1.5-1 0 0Z'

type Leaf = { x: number; y: number; rotate: number }

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

// Mỗi vị trí trên nhánh có một lá hướng ra ngoài và một lá hướng vào trong, mũi lá theo chiều đi lên
function buildLeaves(): Leaf[] {
  const leaves: Leaf[] = []
  for (let index = 0; index < LEAF_PAIRS; index += 1) {
    const degrees = START_DEGREES + ((END_DEGREES - START_DEGREES) * index) / (LEAF_PAIRS - 1)
    const radians = degreesToRadians(degrees)
    const x = CENTER + RADIUS * Math.cos(radians)
    const y = CENTER + RADIUS * Math.sin(radians)
    const along = degrees + 180
    leaves.push({ x, y, rotate: along - LEAF_TILT_DEGREES }, { x, y, rotate: along + LEAF_TILT_DEGREES })
  }
  return leaves
}

const LEAVES = buildLeaves()

function arcPoint(degrees: number): string {
  const radians = degreesToRadians(degrees)
  return `${(CENTER + RADIUS * Math.cos(radians)).toFixed(2)} ${(CENTER + RADIUS * Math.sin(radians)).toFixed(2)}`
}

function Branch() {
  return (
    <>
      <path
        d={`M${arcPoint(START_DEGREES)}A${RADIUS} ${RADIUS} 0 0 1 ${arcPoint(END_DEGREES)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {LEAVES.map((leaf, index) => (
        <path key={index} d={LEAF_PATH} transform={`translate(${leaf.x.toFixed(2)} ${leaf.y.toFixed(2)}) rotate(${leaf.rotate})`} />
      ))}
    </>
  )
}

// Vòng nguyệt quế: hai nhánh lá đối xứng hở phía trên, màu theo currentColor
export default function LaurelIcon({ className = 'size-6' }: LaurelIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <Branch />
      <g transform="matrix(-1 0 0 1 24 0)">
        <Branch />
      </g>
    </svg>
  )
}
