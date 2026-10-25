import { describe, expect, it } from 'vitest'
import { pickTab } from '@/lib/admin/tabs'

describe('pickTab', () => {
  const tabs = ['entries', 'info', 'add'] as const

  it('trả tab hợp lệ', () => {
    expect(pickTab(tabs, 'info', 'entries')).toBe('info')
  })

  it('về mặc định khi thiếu hoặc sai', () => {
    expect(pickTab(tabs, undefined, 'entries')).toBe('entries')
    expect(pickTab(tabs, 'xyz', 'entries')).toBe('entries')
  })
})
