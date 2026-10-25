import { describe, expect, it } from 'vitest'
import { toggleReaction, totalReactions } from '@/lib/posts/reaction'

describe('toggleReaction', () => {
  it('thả tim thì bật và tăng số đếm', () => {
    expect(toggleReaction({ mine: false, count: 4 })).toEqual({ mine: true, count: 5 })
  })

  it('bấm lại thì bỏ tim và giảm số đếm', () => {
    expect(toggleReaction({ mine: true, count: 5 })).toEqual({ mine: false, count: 4 })
  })

  it('không xuống dưới 0', () => {
    expect(toggleReaction({ mine: true, count: 0 }).count).toBe(0)
  })
})

describe('totalReactions', () => {
  it('cộng mọi loại cảm xúc, bỏ giá trị thiếu', () => {
    expect(totalReactions({ heart: 3, like: 2, fire: undefined })).toBe(5)
    expect(totalReactions({})).toBe(0)
  })
})
