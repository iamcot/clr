'use client'

import { useState } from 'react'

export type ChartBar = { label: string; value: number; display: string }

const CHART_WIDTH = 320
const CHART_HEIGHT = 120
const BAR_GAP = 4

export default function StatsBarChart({ bars }: { bars: ChartBar[] }) {
  const lastIndex = bars.length - 1
  const [selected, setSelected] = useState(lastIndex)
  const maxValue = Math.max(1, ...bars.map((bar) => bar.value))
  const barWidth = CHART_WIDTH / Math.max(1, bars.length)
  const selectedBar = bars[selected]

  return (
    <div>
      <p className="text-sm text-muted">
        {selectedBar ? `${selectedBar.label}: ` : ''}
        <strong className="text-ink">{selectedBar?.display ?? ''}</strong>
      </p>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="mt-1 w-full" role="img" aria-label="Biểu đồ km">
        {bars.map((bar, index) => {
          const height = (bar.value / maxValue) * (CHART_HEIGHT - 4)
          const x = index * barWidth
          return (
            <g key={bar.label} onClick={() => setSelected(index)} className="cursor-pointer">
              <rect x={x} y={0} width={barWidth} height={CHART_HEIGHT} fill="transparent" />
              <rect
                x={x + BAR_GAP / 2}
                y={CHART_HEIGHT - height}
                width={Math.max(1, barWidth - BAR_GAP)}
                height={height}
                rx={2}
                fill={index === selected ? 'var(--color-brand)' : 'var(--color-lime)'}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
