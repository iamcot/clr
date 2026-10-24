import { describe, expect, it } from 'vitest'
import { parseMemberFilter, toLikePattern } from '@/lib/members/memberFilter'

describe('parseMemberFilter', () => {
  it('mặc định là tab chờ duyệt, không lọc', () => {
    expect(parseMemberFilter({})).toEqual({ status: 'pending', search: '', type: null, gender: null })
  })

  it('nhận giá trị hợp lệ và cắt khoảng trắng ở ô tìm', () => {
    expect(parseMemberFilter({ status: 'active', q: '  Lan ', type: 'official', gender: 'F' })).toEqual({
      status: 'active',
      search: 'Lan',
      type: 'official',
      gender: 'F',
    })
  })

  it('bỏ qua giá trị lạ', () => {
    expect(parseMemberFilter({ status: 'admin', type: 'vip', gender: 'Z' })).toEqual({
      status: 'pending',
      search: '',
      type: null,
      gender: null,
    })
  })
})

describe('toLikePattern', () => {
  it('escape ký tự đặc biệt của LIKE', () => {
    expect(toLikePattern('50%_a\\b')).toBe('%50\\%\\_a\\\\b%')
  })
})
