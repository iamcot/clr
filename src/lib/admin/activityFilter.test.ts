import { describe, expect, it } from 'vitest'
import { buildSportClause, dayEndIso, dayStartIso, parseActivityFilter } from '@/lib/admin/activityFilter'

describe('parseActivityFilter', () => {
  it('mặc định là tab đang được tính, trang 1, không lọc', () => {
    expect(parseActivityFilter({})).toEqual({
      tab: 'counted',
      page: 1,
      from: null,
      to: null,
      sports: [],
      memberIds: [],
    })
  })

  it('đọc tab bị loại, ngày, nhóm môn và thành viên', () => {
    const filter = parseActivityFilter({
      show: 'excluded',
      from: '2026-10-01',
      to: '2026-10-31',
      sport: ['run', 'swim', 'bậy'],
      member: ['0b7b5a2e-5d44-4f06-9d6a-1f2b3c4d5e6f', 'khong-hop-le'],
      page: '2',
    })
    expect(filter.tab).toBe('excluded')
    expect(filter.page).toBe(2)
    expect(filter.sports).toEqual(['run', 'swim'])
    expect(filter.memberIds).toEqual(['0b7b5a2e-5d44-4f06-9d6a-1f2b3c4d5e6f'])
    expect(filter.from).toBe('2026-10-01')
  })

  it('bỏ ngày sai định dạng', () => {
    expect(parseActivityFilter({ from: '1/10/2026' }).from).toBeNull()
  })
})

describe('buildSportClause', () => {
  it('trả null khi không chọn nhóm', () => {
    expect(buildSportClause([])).toBeNull()
  })

  it('gộp các nhóm bằng dấu phẩy', () => {
    expect(buildSportClause(['run', 'swim'])).toBe('sport_type.in.(Run,TrailRun,VirtualRun),sport_type.in.(Swim)')
  })

  it('nhóm khác loại trừ mọi loại đã biết', () => {
    const clause = buildSportClause(['other'])
    expect(clause).toContain('sport_type.not.in.(Run,TrailRun,VirtualRun,Ride')
    expect(clause).toContain('Swim)')
  })
})

describe('dayStartIso / dayEndIso', () => {
  it('quy ngày giờ Việt Nam về UTC', () => {
    expect(dayStartIso('2026-10-01')).toBe('2026-09-30T17:00:00.000Z')
    expect(dayEndIso('2026-10-01')).toBe('2026-10-01T16:59:59.999Z')
  })
})
