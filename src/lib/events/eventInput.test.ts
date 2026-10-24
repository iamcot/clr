import { describe, expect, it } from 'vitest'
import { parseEventInput } from '@/lib/events/eventInput'

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const VALID = {
  title: 'Chạy nhóm sáng CN',
  kind: 'group_run',
  status: 'published',
  starts_at: '2026-10-26T05:15',
  ends_at: '2026-10-26T07:00',
}

describe('parseEventInput', () => {
  it('đọc event hợp lệ, giờ nhập là giờ Việt Nam', () => {
    const result = parseEventInput(form({ ...VALID, capacity: '30', route_distance_km: '10', fee: '50000' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.startsAt).toBe('2026-10-25T22:15:00.000Z')
    expect(result.value.capacity).toBe(30)
    expect(result.value.routeDistanceM).toBe(10_000)
    expect(result.value.fee).toBe(50_000)
    expect(result.value.absentPenalty).toBe(false)
  })

  it('báo lỗi thiếu tên và giờ kết thúc trước giờ bắt đầu', () => {
    const result = parseEventInput(form({ ...VALID, title: ' ', ends_at: '2026-10-26T05:00' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.title).toBeDefined()
    expect(result.errors.ends_at).toBeDefined()
  })

  it('số chỗ phải là số nguyên dương', () => {
    const result = parseEventInput(form({ ...VALID, capacity: '0' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.capacity).toBeDefined()
  })

  it('toạ độ phải đủ cả hai', () => {
    const result = parseEventInput(form({ ...VALID, location_lat: '21.03' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.location_lat).toBeDefined()
  })

  it('ảnh bìa phải là https', () => {
    const result = parseEventInput(form({ ...VALID, cover_url: 'http://a.vn/x.jpg' }))
    expect(result.ok).toBe(false)
  })
})
