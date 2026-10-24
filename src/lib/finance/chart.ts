export type MonthlyFlow = { month: string; income: number; expense: number }

export type MonthlyBar = { month: string; label: string; incomeHeight: number; expenseHeight: number }

const MIN_VISIBLE_HEIGHT = 2

// Chiều cao cột theo tỉ lệ với giá trị lớn nhất; có tiền thì cột ít nhất MIN_VISIBLE_HEIGHT để còn thấy
export function scaleMonthlyBars(flows: MonthlyFlow[], maxHeight: number): MonthlyBar[] {
  const peak = Math.max(0, ...flows.flatMap((flow) => [flow.income, flow.expense]))
  const heightOf = (amount: number) => {
    if (amount <= 0 || peak === 0) return 0
    return Math.max(MIN_VISIBLE_HEIGHT, Math.round((amount / peak) * maxHeight))
  }
  return flows.map((flow) => ({
    month: flow.month,
    label: `T${Number(flow.month.slice(5))}`,
    incomeHeight: heightOf(flow.income),
    expenseHeight: heightOf(flow.expense),
  }))
}
