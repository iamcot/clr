import { describe, expect, it } from 'vitest'
import { validAvatarUrl } from '@/lib/format/avatar'

describe('validAvatarUrl', () => {
  it('giữ nguyên URL http(s) hợp lệ', () => {
    expect(validAvatarUrl('https://dgalywyr863hv.cloudfront.net/pictures/a.jpg')).toBe('https://dgalywyr863hv.cloudfront.net/pictures/a.jpg')
  })

  it('bỏ giá trị rỗng, đường dẫn tương đối và giao thức lạ', () => {
    expect(validAvatarUrl(null)).toBeNull()
    expect(validAvatarUrl('')).toBeNull()
    expect(validAvatarUrl('avatar/athlete/large.png')).toBeNull()
    expect(validAvatarUrl('javascript:alert(1)')).toBeNull()
  })
})
