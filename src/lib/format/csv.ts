const UTF8_BOM = '﻿'
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r']

export type CsvCell = string | number | null

function formatCell(value: CsvCell): string {
  const text = value === null ? '' : String(value)
  const safeText = FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix)) ? `'${text}` : text
  return /[",\n\r]/.test(safeText) ? `"${safeText.replace(/"/g, '""')}"` : safeText
}

// Có BOM để Excel đọc đúng tiếng Việt; ô bắt đầu bằng ký tự công thức được thêm nháy để không chạy thành công thức
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = rows.map((row) => row.map(formatCell).join(','))
  return UTF8_BOM + [headers.join(','), ...lines].join('\r\n')
}

export function csvResponse(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
