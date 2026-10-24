import { describe, expect, it } from 'vitest'
import { formatRelativeVi } from '@/lib/format/relativeTime'

const NOW = new Date('2026-10-23T12:00:00Z')

describe('formatRelativeVi', () => {
  it('chia theo phút, giờ, ngày', () => {
    expect(formatRelativeVi('2026-10-23T11:59:30Z', NOW)).toBe('Vừa xong')
    expect(formatRelativeVi('2026-10-23T11:55:00Z', NOW)).toBe('5 phút trước')
    expect(formatRelativeVi('2026-10-23T09:00:00Z', NOW)).toBe('3 giờ trước')
    expect(formatRelativeVi('2026-10-21T12:00:00Z', NOW)).toBe('2 ngày trước')
  })

  it('quá một tuần thì trả null', () => {
    expect(formatRelativeVi('2026-10-10T12:00:00Z', NOW)).toBeNull()
  })
})
