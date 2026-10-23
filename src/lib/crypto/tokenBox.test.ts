import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { open, seal } from '@/lib/crypto/tokenBox'

const key = randomBytes(32).toString('base64')

describe('tokenBox', () => {
  it('giải mã ra đúng chuỗi đã mã hoá', () => {
    expect(open(seal('refresh-token-abc', key), key)).toBe('refresh-token-abc')
  })

  it('mã hoá cùng chuỗi hai lần cho kết quả khác nhau', () => {
    expect(seal('abc', key)).not.toBe(seal('abc', key))
  })

  it('báo lỗi khi sửa một byte của dữ liệu mã hoá', () => {
    const [version, iv, authTag, encrypted] = seal('abc', key).split('.')
    const bytes = Buffer.from(encrypted!, 'base64')
    bytes[0] = (bytes[0]! + 1) % 256
    const tampered = [version, iv, authTag, bytes.toString('base64')].join('.')
    expect(() => open(tampered, key)).toThrow()
  })

  it('báo lỗi khi giải mã bằng khoá khác', () => {
    const otherKey = randomBytes(32).toString('base64')
    expect(() => open(seal('abc', key), otherKey)).toThrow()
  })

  it('báo lỗi khi khoá không đủ 32 byte', () => {
    expect(() => seal('abc', Buffer.from('ngan').toString('base64'))).toThrow()
  })
})
