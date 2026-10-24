import { describe, expect, it } from 'vitest'
import { buildImageKey, canUploadPurpose, parseImageUploadRequest } from '@/lib/storage/imageUploadRules'

describe('parseImageUploadRequest', () => {
  const valid = { purpose: 'cover', contentType: 'image/jpeg', bytes: 400_000 }

  it('nhận yêu cầu hợp lệ', () => {
    expect(parseImageUploadRequest(valid)).toEqual({ ok: true, value: { purpose: 'cover', bytes: 400_000 } })
  })

  it('từ chối loại ảnh lạ, kiểu file lạ và kích thước sai', () => {
    expect(parseImageUploadRequest({ ...valid, purpose: 'avatar' }).ok).toBe(false)
    expect(parseImageUploadRequest({ ...valid, contentType: 'application/pdf' }).ok).toBe(false)
    expect(parseImageUploadRequest({ ...valid, bytes: 0 }).ok).toBe(false)
    expect(parseImageUploadRequest({ ...valid, bytes: 50 * 1024 * 1024 }).ok).toBe(false)
  })
})

describe('canUploadPurpose', () => {
  it('ảnh bìa chỉ BCN, giấy chứng nhận ai cũng được', () => {
    expect(canUploadPurpose('cover', false)).toBe(false)
    expect(canUploadPurpose('cover', true)).toBe(true)
    expect(canUploadPurpose('certificate', false)).toBe(true)
  })
})

describe('buildImageKey', () => {
  it('đặt theo thư mục của loại ảnh', () => {
    expect(buildImageKey('cover', 'abc')).toBe('covers/abc.jpg')
    expect(buildImageKey('certificate', 'abc')).toBe('certificates/abc.jpg')
  })
})
