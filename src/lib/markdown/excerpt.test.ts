import { describe, expect, it } from 'vitest'
import { makeExcerpt } from '@/lib/markdown/excerpt'

describe('makeExcerpt', () => {
  it('bỏ ký hiệu markdown và giữ chữ của liên kết', () => {
    expect(makeExcerpt('# Chào\n\n**Các bạn** xem [bảng](https://x.vn)', 100)).toBe('Chào Các bạn xem bảng')
  })

  it('cắt dài và thêm dấu ba chấm', () => {
    expect(makeExcerpt('abcdefghij', 5)).toBe('abcde…')
  })
})
