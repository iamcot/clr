import { describe, expect, it } from 'vitest'
import { buildClubRecords, classifyDistance, isNewClubRecord, type RecordResult } from '@/lib/hallOfFame/records'

function result(overrides: Partial<RecordResult>): RecordResult {
  return {
    id: 'r1',
    memberId: 'm1',
    displayName: 'An',
    avatarUrl: null,
    gender: 'M',
    distanceMeters: 21097,
    chipTimeSeconds: 6000,
    raceName: 'Giải A',
    raceDate: '2026-03-01',
    ...overrides,
  }
}

describe('classifyDistance', () => {
  it('gom cự ly gần chuẩn vào cùng nhóm', () => {
    expect(classifyDistance(5000)).toBe('5K')
    expect(classifyDistance(10150)).toBe('10K')
    expect(classifyDistance(21000)).toBe('HM')
    expect(classifyDistance(42195)).toBe('FM')
  })

  it('cự ly lạ thì không thuộc nhóm nào', () => {
    expect(classifyDistance(15000)).toBeNull()
  })
})

describe('buildClubRecords', () => {
  const table = (results: RecordResult[]) =>
    buildClubRecords(results).find((item) => item.distanceKey === 'HM' && item.genderKey === 'M')

  it('xếp theo thời gian nhanh nhất', () => {
    const entries = table([
      result({ id: 'a', memberId: 'a', chipTimeSeconds: 6200 }),
      result({ id: 'b', memberId: 'b', chipTimeSeconds: 5900 }),
    ])?.entries
    expect(entries?.map((entry) => [entry.rank, entry.memberId])).toEqual([
      [1, 'b'],
      [2, 'a'],
    ])
  })

  it('mỗi người chỉ xuất hiện một lần với thành tích tốt nhất', () => {
    const entries = table([
      result({ id: 'a1', memberId: 'a', chipTimeSeconds: 6200 }),
      result({ id: 'a2', memberId: 'a', chipTimeSeconds: 6000 }),
    ])?.entries
    expect(entries).toHaveLength(1)
    expect(entries?.[0]?.id).toBe('a2')
  })

  it('tách theo giới tính và bỏ người chưa khai giới tính', () => {
    const tables = buildClubRecords([
      result({ id: 'f', memberId: 'f', gender: 'F' }),
      result({ id: 'x', memberId: 'x', gender: null }),
    ])
    expect(tables.find((item) => item.distanceKey === 'HM' && item.genderKey === 'M')?.entries).toHaveLength(0)
    expect(tables.find((item) => item.distanceKey === 'HM' && item.genderKey === 'F')?.entries).toHaveLength(1)
  })
})

describe('isNewClubRecord', () => {
  const existing = result({ id: 'old', memberId: 'old', chipTimeSeconds: 6000 })

  it('nhanh hơn kỷ lục cũ thì là kỷ lục mới', () => {
    expect(isNewClubRecord([existing, result({ id: 'new', memberId: 'new', chipTimeSeconds: 5900 })], 'new')).toBe(true)
  })

  it('chậm hơn hoặc bằng thì không', () => {
    expect(isNewClubRecord([existing, result({ id: 'new', memberId: 'new', chipTimeSeconds: 6000 })], 'new')).toBe(false)
  })

  it('kết quả đầu tiên của nhóm là kỷ lục', () => {
    expect(isNewClubRecord([existing], 'old')).toBe(true)
  })
})
