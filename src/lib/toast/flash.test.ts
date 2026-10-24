import { describe, expect, it } from 'vitest'
import { parseFlashCode } from '@/lib/toast/flash'

describe('parseFlashCode', () => {
  it('trả về toast của mã hợp lệ', () => {
    expect(parseFlashCode('profile_saved')).toEqual({ kind: 'success', text: 'Đã lưu hồ sơ' })
  })

  it('bỏ qua mã lạ hoặc rỗng', () => {
    expect(parseFlashCode('nope')).toBeNull()
    expect(parseFlashCode('toString')).toBeNull()
    expect(parseFlashCode(undefined)).toBeNull()
  })
})
