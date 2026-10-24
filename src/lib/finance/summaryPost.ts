import { formatVnd } from '@/lib/format/money'
import type { FundReport } from '@/lib/finance/report'
import type { AutoPostContent } from '@/lib/posts/autoPostContent'

const TOP_CATEGORIES = 3

function categoryLines(categories: FundReport['income']['categories']): string {
  return categories
    .slice(0, TOP_CATEGORIES)
    .map((category) => `- ${category.name}: ${formatVnd(category.amount)}`)
    .join('\n')
}

// Bài tóm tắt quỹ tự đăng khi chốt sổ một tháng
export function buildFundCloseSummaryPost(monthLabel: string, report: FundReport): AutoPostContent {
  const sections = [
    `Quỹ CLB đã chốt sổ ${monthLabel.toLowerCase()}.`,
    `- Số dư đầu kỳ: ${formatVnd(report.opening)}\n- Tổng thu: ${formatVnd(report.income.total)}\n- Tổng chi: ${formatVnd(report.expense.total)}\n- **Số dư cuối kỳ: ${formatVnd(report.closing)}**`,
  ]
  if (report.income.categories.length > 0) sections.push(`**Thu nhiều nhất**\n${categoryLines(report.income.categories)}`)
  if (report.expense.categories.length > 0) sections.push(`**Chi nhiều nhất**\n${categoryLines(report.expense.categories)}`)
  sections.push('Xem chi tiết ở tab Quỹ.')
  return { title: `Quỹ CLB ${monthLabel}`, bodyMd: sections.join('\n\n') }
}
