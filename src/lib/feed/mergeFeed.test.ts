import { describe, expect, it } from 'vitest'
import { mergeFeedSources, type FeedEntry, type FeedSource } from '@/lib/feed/mergeFeed'

function entry(id: string, at: string): FeedEntry {
  return {
    kind: 'highlight',
    id,
    at,
    highlight: { id, memberId: 'm1', memberName: 'An', kind: 'pr', text: 'đạt PR', date: at },
  }
}

const ids = (entries: FeedEntry[]) => entries.map((item) => item.id)

describe('mergeFeedSources', () => {
  it('xếp các nguồn xen kẽ theo thời gian, mới nhất trước', () => {
    const posts: FeedSource = { entries: [entry('p1', '2026-10-24T10:00:00Z'), entry('p2', '2026-10-22T10:00:00Z')], hasMore: false }
    const news: FeedSource = { entries: [entry('h1', '2026-10-23T10:00:00Z')], hasMore: false }
    const page = mergeFeedSources([posts, news], 10)
    expect(ids(page.entries)).toEqual(['p1', 'h1', 'p2'])
    expect(page.nextCursor).toBeNull()
  })

  it('cắt theo cỡ trang và trả mốc cho trang sau', () => {
    const source: FeedSource = {
      entries: [entry('a', '2026-10-24T10:00:00Z'), entry('b', '2026-10-23T10:00:00Z'), entry('c', '2026-10-22T10:00:00Z')],
      hasMore: false,
    }
    const page = mergeFeedSources([source], 2)
    expect(ids(page.entries)).toEqual(['a', 'b'])
    expect(page.nextCursor).toBe('2026-10-23T10:00:00Z')
  })

  it('nguồn còn dữ liệu chưa tải thì không chen mục cũ hơn phần đã tải của nó', () => {
    const posts: FeedSource = { entries: [entry('p1', '2026-10-24T10:00:00Z'), entry('p2', '2026-10-20T10:00:00Z')], hasMore: true }
    const news: FeedSource = { entries: [entry('h1', '2026-10-21T10:00:00Z'), entry('h2', '2026-10-10T10:00:00Z')], hasMore: false }
    const page = mergeFeedSources([posts, news], 10)
    expect(ids(page.entries)).toEqual(['p1', 'h1', 'p2'])
    expect(page.nextCursor).toBe('2026-10-20T10:00:00Z')
  })

  it('không có gì thì trang rỗng', () => {
    expect(mergeFeedSources([{ entries: [], hasMore: false }], 10)).toEqual({ entries: [], nextCursor: null })
  })
})
