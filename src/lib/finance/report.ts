export type ReportRow = { kind: string; direction: string | null; category: string | null; amount: number }

export type CategoryTotal = { name: string; amount: number }

export type FundReport = {
  opening: number
  income: { total: number; categories: CategoryTotal[] }
  expense: { total: number; categories: CategoryTotal[] }
  net: number
  closing: number
}

function categoriesOf(rows: ReportRow[], direction: 'in' | 'out'): CategoryTotal[] {
  return rows
    .filter((row) => row.kind === 'category' && row.direction === direction)
    .map((row) => ({ name: row.category ?? 'Chưa phân loại', amount: row.amount }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'vi'))
}

function sum(categories: CategoryTotal[]): number {
  return categories.reduce((total, category) => total + category.amount, 0)
}

// Cuối kỳ = đầu kỳ + thu − chi; giao dịch đã huỷ đã bị loại ở DB nên không có trong rows
export function assembleFundReport(rows: ReportRow[]): FundReport {
  const opening = rows.filter((row) => row.kind === 'opening').reduce((total, row) => total + row.amount, 0)
  const incomeCategories = categoriesOf(rows, 'in')
  const expenseCategories = categoriesOf(rows, 'out')
  const income = sum(incomeCategories)
  const expense = sum(expenseCategories)
  return {
    opening,
    income: { total: income, categories: incomeCategories },
    expense: { total: expense, categories: expenseCategories },
    net: income - expense,
    closing: opening + income - expense,
  }
}
