import { describe, expect, it } from 'vitest'
import { loginHref, safeNextPath } from '@/lib/auth/nextPath'

describe('safeNextPath', () => {
  it('nhận đường dẫn nội bộ', () => {
    expect(safeNextPath('/challenges/abc?tab=1')).toBe('/challenges/abc?tab=1')
  })

  it('từ chối rỗng, link ngoài và dạng //host', () => {
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath('https://evil.com')).toBeNull()
    expect(safeNextPath('//evil.com')).toBeNull()
    expect(safeNextPath('/\\evil.com')).toBeNull()
  })
})

describe('loginHref', () => {
  it('mã hoá đường dẫn quay lại', () => {
    expect(loginHref('/events/1?x=2')).toBe('/login?next=%2Fevents%2F1%3Fx%3D2')
  })
})
