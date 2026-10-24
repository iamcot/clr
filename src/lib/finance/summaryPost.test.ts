import { describe, expect, it } from 'vitest'
import { assembleFundReport } from '@/lib/finance/report'
import { buildFundCloseSummaryPost } from '@/lib/finance/summaryPost'

describe('buildFundCloseSummaryPost', () => {
  it('có số dư đầu kỳ, thu, chi, cuối kỳ và danh mục lớn nhất', () => {
    const report = assembleFundReport([
      { kind: 'opening', direction: null, category: null, amount: 1_000_000 },
      { kind: 'category', direction: 'in', category: 'Phạt', amount: 500_000 },
      { kind: 'category', direction: 'out', category: 'Event', amount: 200_000 },
    ])
    const post = buildFundCloseSummaryPost('Tháng 10/2026', report)
    expect(post.title).toBe('Quỹ CLB Tháng 10/2026')
    expect(post.bodyMd).toContain('Số dư đầu kỳ: 1.000.000đ')
    expect(post.bodyMd).toContain('Số dư cuối kỳ: 1.300.000đ')
    expect(post.bodyMd).toContain('- Phạt: 500.000đ')
    expect(post.bodyMd).toContain('- Event: 200.000đ')
  })

  it('tháng không có thu chi thì bỏ phần danh mục', () => {
    const post = buildFundCloseSummaryPost('Tháng 9/2026', assembleFundReport([]))
    expect(post.bodyMd).not.toContain('Thu nhiều nhất')
  })
})
