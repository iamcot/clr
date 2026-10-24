import { describe, expect, it } from 'vitest'
import { deriveSeedNumber, generateSeed, sha256Hex } from '@/lib/draw/seed'

describe('sha256Hex', () => {
  it('ra đúng giá trị chuẩn của chuỗi rỗng và "abc"', async () => {
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('deriveSeedNumber', () => {
  it('lấy 4 byte đầu của sha256 (big-endian)', async () => {
    expect(await deriveSeedNumber('abc')).toBe(0xba7816bf)
  })
})

describe('generateSeed', () => {
  it('sinh chuỗi hex đủ dài và không trùng', () => {
    const first = generateSeed(32)
    expect(first).toMatch(/^[0-9a-f]{64}$/)
    expect(generateSeed(32)).not.toBe(first)
  })
})
