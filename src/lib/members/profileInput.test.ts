import { describe, expect, it } from 'vitest'
import { parseProfileInput } from '@/lib/members/profileInput'

const CURRENT_YEAR = 2026

function parse(fields: Record<string, string>) {
  return parseProfileInput(new Map(Object.entries(fields)), CURRENT_YEAR)
}

describe('parseProfileInput', () => {
  it('chấp nhận form đủ thông tin và cắt khoảng trắng', () => {
    expect(parse({ display_name: '  An Nguyễn ', gender: 'F', birth_year: '1990', phone: '0912 345 678' })).toEqual({
      ok: true,
      value: { display_name: 'An Nguyễn', gender: 'F', birth_year: 1990, phone: '0912345678' },
    })
  })

  it('cho bỏ trống giới tính, năm sinh, số điện thoại', () => {
    expect(parse({ display_name: 'An' })).toEqual({
      ok: true,
      value: { display_name: 'An', gender: null, birth_year: null, phone: null },
    })
  })

  it('bắt buộc có tên hiển thị', () => {
    const result = parse({ display_name: '   ' })
    expect(result).toMatchObject({ ok: false, errors: { display_name: expect.any(String) } })
  })

  it('từ chối tên quá dài', () => {
    expect(parse({ display_name: 'a'.repeat(51) })).toMatchObject({ ok: false })
  })

  it('từ chối giới tính lạ', () => {
    expect(parse({ display_name: 'An', gender: 'Z' })).toMatchObject({ ok: false, errors: { gender: expect.any(String) } })
  })

  it('từ chối năm sinh ngoài khoảng hoặc không phải số nguyên', () => {
    expect(parse({ display_name: 'An', birth_year: '1900' })).toMatchObject({ ok: false })
    expect(parse({ display_name: 'An', birth_year: '2025' })).toMatchObject({ ok: false })
    expect(parse({ display_name: 'An', birth_year: '19.5' })).toMatchObject({ ok: false })
    expect(parse({ display_name: 'An', birth_year: 'abc' })).toMatchObject({ ok: false })
  })

  it('nhận số điện thoại dạng +84 và từ chối số sai', () => {
    expect(parse({ display_name: 'An', phone: '+84912345678' })).toMatchObject({ ok: true })
    expect(parse({ display_name: 'An', phone: '12345' })).toMatchObject({ ok: false, errors: { phone: expect.any(String) } })
  })

  it('gom lỗi của nhiều trường cùng lúc', () => {
    const result = parse({ display_name: '', birth_year: '1800', phone: 'x' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['birth_year', 'display_name', 'phone'])
  })
})
