import { describe, expect, it } from 'vitest'
import { parseDrawInput, parsePrizeLines } from '@/lib/draw/drawInput'

const SOURCE_ID = '6f1c1d5e-0a7b-4c8e-9d2f-3b4a5c6d7e8f'

function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

describe('parsePrizeLines', () => {
  it('đọc tên giải và số lượng, thiếu số lượng thì là 1', () => {
    expect(parsePrizeLines('Giải nhất: giày | 1\nKhuyến khích: tất | 5\nQuà nhỏ')).toEqual([
      { name: 'Giải nhất: giày', quantity: 1 },
      { name: 'Khuyến khích: tất', quantity: 5 },
      { name: 'Quà nhỏ', quantity: 1 },
    ])
  })

  it('từ chối rỗng, số lượng sai hoặc thiếu tên', () => {
    expect(parsePrizeLines('  \n')).toBeNull()
    expect(parsePrizeLines('Giải | 0')).toBeNull()
    expect(parsePrizeLines('Giải | abc')).toBeNull()
    expect(parsePrizeLines('| 2')).toBeNull()
  })
})

describe('parseDrawInput', () => {
  const valid = { title: 'Quay số tháng 10', source_type: 'challenge_completed', challenge_id: SOURCE_ID, prizes: 'Giày | 1' }

  it('nhận dữ liệu hợp lệ', () => {
    expect(parseDrawInput(form(valid))).toEqual({
      ok: true,
      value: {
        title: 'Quay số tháng 10',
        sourceType: 'challenge_completed',
        sourceId: SOURCE_ID,
        prizes: [{ name: 'Giày', quantity: 1 }],
      },
    })
  })

  it('nguồn event đọc ô event_id', () => {
    const parsed = parseDrawInput(form({ ...valid, source_type: 'event_checked_in', challenge_id: '', event_id: SOURCE_ID }))
    expect(parsed.ok && parsed.value.sourceId).toBe(SOURCE_ID)
  })

  it('chọn tay thì không cần nguồn', () => {
    const parsed = parseDrawInput(form({ ...valid, source_type: 'manual', challenge_id: '' }))
    expect(parsed.ok && parsed.value.sourceId).toBeNull()
  })

  it('từ chối thiếu tên, nguồn lạ, thiếu nguồn hoặc giải sai', () => {
    expect(parseDrawInput(form({ ...valid, title: ' ' })).ok).toBe(false)
    expect(parseDrawInput(form({ ...valid, source_type: 'abc' })).ok).toBe(false)
    expect(parseDrawInput(form({ ...valid, challenge_id: '' })).ok).toBe(false)
    expect(parseDrawInput(form({ ...valid, prizes: '' })).ok).toBe(false)
  })
})
