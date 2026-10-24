import { scaleMonthlyBars, type MonthlyFlow } from '@/lib/finance/chart'

const CHART_HEIGHT_PX = 120
const BAR_WIDTH_PX = 9
const BAR_GAP_PX = 2
const GROUP_WIDTH_PX = 28
const LABEL_HEIGHT_PX = 16

// Cột thu (xanh) và chi (cam) của từng tháng, vẽ bằng SVG
export default function FundMonthlyChart({ flows }: { flows: MonthlyFlow[] }) {
  const bars = scaleMonthlyBars(flows, CHART_HEIGHT_PX)
  const width = bars.length * GROUP_WIDTH_PX
  const height = CHART_HEIGHT_PX + LABEL_HEIGHT_PX
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Thu chi quỹ theo tháng">
        {bars.map((bar, index) => {
          const x = index * GROUP_WIDTH_PX + (GROUP_WIDTH_PX - 2 * BAR_WIDTH_PX - BAR_GAP_PX) / 2
          return (
            <g key={bar.month}>
              <rect x={x} y={CHART_HEIGHT_PX - bar.incomeHeight} width={BAR_WIDTH_PX} height={bar.incomeHeight} rx="1.5" className="fill-brand" />
              <rect
                x={x + BAR_WIDTH_PX + BAR_GAP_PX}
                y={CHART_HEIGHT_PX - bar.expenseHeight}
                width={BAR_WIDTH_PX}
                height={bar.expenseHeight}
                rx="1.5"
                className="fill-danger"
              />
              <text x={index * GROUP_WIDTH_PX + GROUP_WIDTH_PX / 2} y={height - 3} textAnchor="middle" fontSize="7" className="fill-muted">
                {bar.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-1 flex justify-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-brand" /> Thu
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-danger" /> Chi
        </span>
      </p>
    </div>
  )
}
