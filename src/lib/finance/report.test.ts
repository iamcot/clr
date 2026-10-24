import { describe, expect, it } from 'vitest'
import { assembleFundReport, type ReportRow } from '@/lib/finance/report'

const ROWS: ReportRow[] = [
  { kind: 'opening', direction: null, category: null, amount: 1_000_000 },
  { kind: 'category', direction: 'in', category: 'Phạt', amount: 400_000 },
  { kind: 'category', direction: 'in', category: 'Đóng quỹ', amount: 900_000 },
  { kind: 'category', direction: 'out', category: 'Event', amount: 250_000 },
]

describe('assembleFundReport', () => {
  it('cuối kỳ bằng đầu kỳ cộng thu trừ chi', () => {
    const report = assembleFundReport(ROWS)
    expect(report.opening).toBe(1_000_000)
    expect(report.income.total).toBe(1_300_000)
    expect(report.expense.total).toBe(250_000)
    expect(report.net).toBe(1_050_000)
    expect(report.closing).toBe(2_050_000)
  })

  it('xếp danh mục từ lớn đến nhỏ', () => {
    expect(assembleFundReport(ROWS).income.categories.map((category) => category.name)).toEqual(['Đóng quỹ', 'Phạt'])
  })

  it('kỳ không có giao dịch thì giữ nguyên số dư đầu kỳ', () => {
    const report = assembleFundReport([{ kind: 'opening', direction: null, category: null, amount: 500 }])
    expect(report.closing).toBe(500)
    expect(report.income.categories).toEqual([])
  })

  it('không có dòng nào thì toàn số 0', () => {
    expect(assembleFundReport([]).closing).toBe(0)
  })
})
