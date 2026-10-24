const VI_LOCALE = 'vi-VN'

export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(VI_LOCALE, { maximumFractionDigits: maxFractionDigits }).format(value)
}

export function formatFixed(value: number, fractionDigits: number): string {
  return new Intl.NumberFormat(VI_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
