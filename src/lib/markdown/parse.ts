export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: InlineNode[] }

export type BlockNode =
  | { type: 'heading'; level: 1 | 2 | 3; children: InlineNode[] }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }
  | { type: 'quote'; children: InlineNode[] }

const MAX_INLINE_DEPTH = 3
const SAFE_LINK_PATTERN = /^(https?:\/\/|mailto:|\/(?!\/))/i
const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`|\[([^\]]+)\]\(([^)\s]+)\)/

// Chỉ nhận liên kết http, https, mailto và đường dẫn nội bộ bắt đầu bằng một dấu /; mọi thứ khác (javascript:, data:) thành chữ thường
export function isSafeLink(href: string): boolean {
  return SAFE_LINK_PATTERN.test(href)
}

export function parseInline(text: string, depth = 0): InlineNode[] {
  const match = depth < MAX_INLINE_DEPTH ? INLINE_PATTERN.exec(text) : null
  if (!match) return text === '' ? [] : [{ type: 'text', text }]

  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match[0].length)
  const [, bold, starItalic, underscoreItalic, code, linkText, href] = match
  const node = buildInlineNode({ bold, italic: starItalic ?? underscoreItalic, code, linkText, href }, match[0], depth)
  return [...parseInline(before, depth), ...node, ...parseInline(after, depth)]
}

type InlineParts = {
  bold: string | undefined
  italic: string | undefined
  code: string | undefined
  linkText: string | undefined
  href: string | undefined
}

function buildInlineNode(parts: InlineParts, raw: string, depth: number): InlineNode[] {
  if (parts.bold !== undefined) return [{ type: 'bold', children: parseInline(parts.bold, depth + 1) }]
  if (parts.italic !== undefined) return [{ type: 'italic', children: parseInline(parts.italic, depth + 1) }]
  if (parts.code !== undefined) return [{ type: 'code', text: parts.code }]
  if (parts.linkText !== undefined && parts.href !== undefined && isSafeLink(parts.href)) {
    return [{ type: 'link', href: parts.href, children: parseInline(parts.linkText, depth + 1) }]
  }
  return [{ type: 'text', text: raw }]
}

const HEADING_PATTERN = /^(#{1,3})\s+(.+)$/
const BULLET_PATTERN = /^[-*]\s+(.+)$/
const ORDERED_PATTERN = /^\d+[.)]\s+(.+)$/
const QUOTE_PATTERN = /^>\s?(.*)$/

function listItemText(line: string, ordered: boolean): string | null {
  return (ordered ? ORDERED_PATTERN : BULLET_PATTERN).exec(line)?.[1] ?? null
}

function parseList(lines: string[], start: number, ordered: boolean): { node: BlockNode; next: number } {
  const items: InlineNode[][] = []
  let index = start
  for (
    let text = listItemText(lines[index] ?? '', ordered);
    text !== null;
    text = listItemText(lines[index] ?? '', ordered)
  ) {
    items.push(parseInline(text))
    index += 1
  }
  return { node: { type: 'list', ordered, items }, next: index }
}

function isBlockStart(line: string): boolean {
  return (
    HEADING_PATTERN.test(line) || BULLET_PATTERN.test(line) || ORDERED_PATTERN.test(line) || QUOTE_PATTERN.test(line)
  )
}

function parseParagraph(lines: string[], start: number): { node: BlockNode; next: number } {
  const collected: string[] = []
  let index = start
  while (
    index < lines.length &&
    (lines[index] ?? '').trim() !== '' &&
    (index === start || !isBlockStart(lines[index] ?? ''))
  ) {
    collected.push((lines[index] ?? '').trim())
    index += 1
  }
  return { node: { type: 'paragraph', children: parseInline(collected.join(' ')) }, next: index }
}

// Markdown tối giản và an toàn: không có HTML thô, không ảnh; thẻ <script> chỉ hiện thành chữ
export function parseMarkdown(source: string): BlockNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: BlockNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = (lines[index] ?? '').trim()
    if (line === '') {
      index += 1
      continue
    }
    const heading = HEADING_PATTERN.exec(line)
    if (heading) {
      const level = Math.min(heading[1]?.length ?? 1, 3) as 1 | 2 | 3
      blocks.push({ type: 'heading', level, children: parseInline(heading[2] ?? '') })
      index += 1
      continue
    }
    const quote = QUOTE_PATTERN.exec(line)
    if (quote) {
      blocks.push({ type: 'quote', children: parseInline(quote[1] ?? '') })
      index += 1
      continue
    }
    const ordered = ORDERED_PATTERN.test(line)
    if (ordered || BULLET_PATTERN.test(line)) {
      const list = parseList(
        lines.map((item) => item.trim()),
        index,
        ordered,
      )
      blocks.push(list.node)
      index = list.next
      continue
    }
    const paragraph = parseParagraph(lines, index)
    blocks.push(paragraph.node)
    index = paragraph.next
  }
  return blocks
}
