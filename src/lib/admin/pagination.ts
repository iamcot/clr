import { ADMIN_PAGE_SIZE } from '@/config/admin'

export type PageWindow = { page: number; pageSize: number; total: number; totalPages: number; from: number; to: number }

export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? '', 10)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

// from/to là chỉ số bắt đầu từ 0, dùng cho range() của Supabase (to đã gồm)
export function pageRange(page: number, pageSize = ADMIN_PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize
  return { from, to: from + pageSize - 1 }
}

export function describePage(page: number, total: number, pageSize = ADMIN_PAGE_SIZE): PageWindow {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const { from, to } = pageRange(current, pageSize)
  return { page: current, pageSize, total, totalPages, from, to }
}

export function slicePage<T>(rows: T[], page: number, pageSize = ADMIN_PAGE_SIZE): { rows: T[]; window: PageWindow } {
  const window = describePage(page, rows.length, pageSize)
  return { rows: rows.slice(window.from, window.to + 1), window }
}

export function hrefWithPage(path: string, params: Record<string, string | string[] | undefined>, page: number): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key === 'page') continue
    for (const item of Array.isArray(value) ? value : [value]) if (item) query.append(key, item)
  }
  if (page > 1) query.set('page', String(page))
  const text = query.toString()
  return text ? `${path}?${text}` : path
}
