import { describe, expect, it } from 'vitest'
import { isSafeLink, parseInline, parseMarkdown } from '@/lib/markdown/parse'

describe('parseInline', () => {
  it('nhận in đậm, in nghiêng và code', () => {
    expect(parseInline('a **b** *c* `d`')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'bold', children: [{ type: 'text', text: 'b' }] },
      { type: 'text', text: ' ' },
      { type: 'italic', children: [{ type: 'text', text: 'c' }] },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'd' },
    ])
  })

  it('chỉ cho liên kết https, http và mailto', () => {
    expect(parseInline('[x](https://clr.vn)')).toEqual([
      { type: 'link', href: 'https://clr.vn', children: [{ type: 'text', text: 'x' }] },
    ])
    expect(parseInline('[x](javascript:alert(1))')).toEqual([
      { type: 'text', text: '[x](javascript:alert(1)' },
      { type: 'text', text: ')' },
    ])
    expect(isSafeLink('data:text/html,hi')).toBe(false)
    expect(isSafeLink('/challenges/abc')).toBe(true)
    expect(isSafeLink('//evil.com')).toBe(false)
  })

  it('giữ nguyên thẻ HTML thành chữ', () => {
    expect(parseInline('<script>alert(1)</script>')).toEqual([{ type: 'text', text: '<script>alert(1)</script>' }])
  })
})

describe('parseMarkdown', () => {
  it('tách tiêu đề, đoạn, danh sách và trích dẫn', () => {
    const blocks = parseMarkdown('# Tiêu đề\n\nDòng một\ndòng hai\n\n- a\n- b\n\n1. x\n2. y\n\n> trích')
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'paragraph', 'list', 'list', 'quote'])
    expect(blocks[1]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'Dòng một dòng hai' }] })
    expect(blocks[2]).toMatchObject({ type: 'list', ordered: false })
    expect(blocks[3]).toMatchObject({ type: 'list', ordered: true })
  })

  it('văn bản rỗng cho danh sách rỗng', () => {
    expect(parseMarkdown('  \n\n')).toEqual([])
  })
})
