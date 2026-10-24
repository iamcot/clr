import { describe, expect, it } from 'vitest'
import { normalizeAdminUsername, validateAdminPassword, validateAdminUsername } from '@/lib/auth/adminCredentials'

describe('normalizeAdminUsername', () => {
  it('cắt khoảng trắng và đưa về chữ thường', () => {
    expect(normalizeAdminUsername('  Thu.Quy ')).toBe('thu.quy')
  })
})

describe('validateAdminUsername', () => {
  it('chấp nhận tên hợp lệ', () => {
    expect(validateAdminUsername('thu.quy_01')).toBeNull()
  })

  it.each(['ab', 'có dấu', 'Hoa', 'a'.repeat(33), 'a b c'])('từ chối %s', (username) => {
    expect(validateAdminUsername(username)).not.toBeNull()
  })
})

describe('validateAdminPassword', () => {
  it('từ chối mật khẩu ngắn', () => {
    expect(validateAdminPassword('123456789')).not.toBeNull()
  })

  it('chấp nhận 10 ký tự', () => {
    expect(validateAdminPassword('1234567890')).toBeNull()
  })

  it('từ chối quá dài', () => {
    expect(validateAdminPassword('a'.repeat(73))).not.toBeNull()
  })
})
