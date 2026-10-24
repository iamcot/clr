import { describe, expect, it } from 'vitest'
import { buildChallengeResultPost, buildLevelDigestPost, pickLevelUps } from '@/lib/posts/autoPostContent'

describe('buildChallengeResultPost', () => {
  it('có số người hoàn thành và top mỗi hạng mục', () => {
    const post = buildChallengeResultPost('Tháng 11', 'abc', [
      {
        name: 'Nam',
        participantCount: 10,
        completedCount: 7,
        top: [
          { rank: 1, name: 'An', valueText: '120,0 km' },
          { rank: 2, name: 'Bình', valueText: '110,5 km' },
        ],
      },
    ])
    expect(post.title).toBe('Kết quả Tháng 11')
    expect(post.bodyMd).toContain('7/10 người hoàn thành.')
    expect(post.bodyMd).toContain('1. An: 120,0 km')
    expect(post.bodyMd).toContain('(/challenges/abc)')
  })

  it('không liệt kê tên khi top rỗng', () => {
    const post = buildChallengeResultPost('T', 'x', [
      { name: 'Chung', participantCount: 3, completedCount: 1, top: [] },
    ])
    expect(post.bodyMd).toContain('1/3 người hoàn thành.')
    expect(post.bodyMd).not.toContain('1. ')
  })
})

describe('pickLevelUps', () => {
  it('lấy level cuối của người thực sự lên trong tuần', () => {
    const result = pickLevelUps([
      { memberId: 'a', oldLevel: 1, newLevel: 2, changedAt: '2026-11-02T00:00:00Z' },
      { memberId: 'a', oldLevel: 2, newLevel: 3, changedAt: '2026-11-04T00:00:00Z' },
      { memberId: 'b', oldLevel: 3, newLevel: 4, changedAt: '2026-11-02T00:00:00Z' },
      { memberId: 'b', oldLevel: 4, newLevel: 3, changedAt: '2026-11-03T00:00:00Z' },
    ])
    expect(result).toEqual([{ memberId: 'a', level: 3 }])
  })
})

describe('buildLevelDigestPost', () => {
  it('mỗi người một dòng', () => {
    const post = buildLevelDigestPost([{ name: 'An', level: 3, levelName: 'Bền bỉ' }])
    expect(post.bodyMd).toContain('- An lên level 3 (Bền bỉ)')
  })
})
