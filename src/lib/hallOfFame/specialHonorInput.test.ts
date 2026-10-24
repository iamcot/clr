import { describe, expect, it } from 'vitest'
import { parseSpecialHonor } from '@/lib/hallOfFame/specialHonorInput'

const MEMBER_ID = '6f1c1d5e-0a7b-4c8e-9d2f-3b4a5c6d7e8f'

function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

describe('parseSpecialHonor', () => {
  const valid = { member_id: MEMBER_ID, title: ' Thành viên tích cực 2026 ', honor_date: '2026-12-31' }

  it('nhận dữ liệu hợp lệ và cắt khoảng trắng', () => {
    expect(parseSpecialHonor(form(valid))).toEqual({
      ok: true,
      value: { memberId: MEMBER_ID, title: 'Thành viên tích cực 2026', detail: '', date: '2026-12-31', imageUrl: null },
    })
  })

  it('từ chối thiếu thành viên, thiếu tên, sai ngày hoặc ảnh không phải https', () => {
    expect(parseSpecialHonor(form({ ...valid, member_id: '' })).ok).toBe(false)
    expect(parseSpecialHonor(form({ ...valid, title: '  ' })).ok).toBe(false)
    expect(parseSpecialHonor(form({ ...valid, honor_date: '31/12/2026' })).ok).toBe(false)
    expect(parseSpecialHonor(form({ ...valid, image_url: 'http://x.vn/a.jpg' })).ok).toBe(false)
  })
})
