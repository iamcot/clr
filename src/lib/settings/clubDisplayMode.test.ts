import { describe, expect, it } from 'vitest'
import { canShowOthersActivities, parseClubDisplayMode } from '@/lib/settings/clubDisplayMode'

describe('parseClubDisplayMode', () => {
  it('nhận giá trị hợp lệ', () => {
    expect(parseClubDisplayMode('full_opt_in')).toBe('full_opt_in')
  })

  it('giá trị lạ hoặc thiếu thì về self_only', () => {
    expect(parseClubDisplayMode('x')).toBe('self_only')
    expect(parseClubDisplayMode(null)).toBe('self_only')
  })
})

describe('canShowOthersActivities', () => {
  it('chỉ full_opt_in mới hiện hoạt động của người khác', () => {
    expect(canShowOthersActivities('full_opt_in')).toBe(true)
    expect(canShowOthersActivities('percent_only')).toBe(false)
    expect(canShowOthersActivities('self_only')).toBe(false)
  })
})
