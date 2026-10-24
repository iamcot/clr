import { describe, expect, it } from 'vitest'
import { scaleMonthlyBars } from '@/lib/finance/chart'

describe('scaleMonthlyBars', () => {
  it('cột cao nhất chiếm hết chiều cao, các cột khác theo tỉ lệ', () => {
    const bars = scaleMonthlyBars(
      [
        { month: '2026-09', income: 1000, expense: 500 },
        { month: '2026-10', income: 250, expense: 0 },
      ],
      100,
    )
    expect(bars[0]).toMatchObject({ label: 'T9', incomeHeight: 100, expenseHeight: 50 })
    expect(bars[1]).toMatchObject({ label: 'T10', incomeHeight: 25, expenseHeight: 0 })
  })

  it('khoản rất nhỏ vẫn thấy được, không có tiền thì cột bằng 0', () => {
    const bars = scaleMonthlyBars([{ month: '2026-09', income: 1_000_000, expense: 1 }], 100)
    expect(bars[0]?.expenseHeight).toBe(2)
    expect(scaleMonthlyBars([{ month: '2026-09', income: 0, expense: 0 }], 100)[0]?.incomeHeight).toBe(0)
  })
})
