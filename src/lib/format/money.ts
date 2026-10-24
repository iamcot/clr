const VND_FORMATTER = new Intl.NumberFormat('vi-VN')

export function formatVnd(amount: number): string {
  return `${VND_FORMATTER.format(amount)}đ`
}

const THOUSAND = 1_000
const MILLION = 1_000_000
const COMPACT_MAX_FRACTION_DIGITS = 2

function trimmed(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: COMPACT_MAX_FRACTION_DIGITS }).format(value)
}

// Gọn cho giao diện admin: 20000 -> "20k", 2100000 -> "2,1m"; dưới 1.000 giữ nguyên số
export function formatVndCompact(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const absolute = Math.abs(amount)
  if (absolute >= MILLION) return `${sign}${trimmed(absolute / MILLION)}m`
  if (absolute >= THOUSAND) return `${sign}${trimmed(absolute / THOUSAND)}k`
  return `${sign}${absolute}`
}
