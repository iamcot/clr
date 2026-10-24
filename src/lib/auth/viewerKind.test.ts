import { describe, expect, it } from 'vitest'
import { viewerKindOf } from '@/lib/auth/viewerKind'

describe('viewerKindOf', () => {
  it('phân biệt khách, người chưa được duyệt và thành viên', () => {
    expect(viewerKindOf(null)).toBe('guest')
    expect(viewerKindOf({ status: 'pending' })).toBe('pending')
    expect(viewerKindOf({ status: 'rejected' })).toBe('pending')
    expect(viewerKindOf({ status: 'active' })).toBe('member')
  })
})
