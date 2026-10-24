const MARKDOWN_SYMBOLS = /[#>*_`]|\[([^\]]*)\]\([^)]*\)/g

// Đoạn đầu dạng chữ thường cho thẻ bài: bỏ ký hiệu markdown, giữ chữ của liên kết
export function makeExcerpt(markdown: string, maxLength: number): string {
  const plain = markdown
    .replace(MARKDOWN_SYMBOLS, (_match, linkText: string | undefined) => linkText ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength).trimEnd()}…`
}
