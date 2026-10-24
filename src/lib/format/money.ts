const VND_FORMATTER = new Intl.NumberFormat('vi-VN')

export function formatVnd(amount: number): string {
  return `${VND_FORMATTER.format(amount)}đ`
}
