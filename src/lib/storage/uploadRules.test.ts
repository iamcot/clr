import { describe, expect, it } from 'vitest'
import {
  buildPhotoKeys,
  hasJpegHeader,
  parsePhotoCompleteRequest,
  parsePhotoUploadRequest,
} from '@/lib/storage/uploadRules'

const EVENT_ID = '6f1c1d5e-0a7b-4c8e-9d2f-3b4a5c6d7e8f'
const PHOTO_ID = '0b9d7c2e-1f3a-4b5c-8d6e-7f8a9b0c1d2e'

describe('parsePhotoUploadRequest', () => {
  const valid = { eventId: EVENT_ID, contentType: 'image/jpeg', photoBytes: 500_000, thumbBytes: 30_000 }

  it('nhận yêu cầu hợp lệ', () => {
    expect(parsePhotoUploadRequest(valid).ok).toBe(true)
  })

  it('từ chối kiểu file ngoài danh sách', () => {
    const result = parsePhotoUploadRequest({ ...valid, contentType: 'application/x-msdownload' })
    expect(result.ok).toBe(false)
  })

  it('báo rõ khi nhận ảnh HEIC', () => {
    const result = parsePhotoUploadRequest({ ...valid, contentType: 'image/heic' })
    expect(result.ok === false && result.message).toContain('HEIC')
  })

  it('từ chối ảnh quá lớn hoặc kích thước không phải số', () => {
    expect(parsePhotoUploadRequest({ ...valid, photoBytes: 50_000_000 }).ok).toBe(false)
    expect(parsePhotoUploadRequest({ ...valid, thumbBytes: '10' }).ok).toBe(false)
  })

  it('từ chối event id sai định dạng và body rỗng', () => {
    expect(parsePhotoUploadRequest({ ...valid, eventId: 'abc' }).ok).toBe(false)
    expect(parsePhotoUploadRequest(null).ok).toBe(false)
  })
})

describe('buildPhotoKeys', () => {
  it('sinh key theo event và id ảnh', () => {
    expect(buildPhotoKeys(EVENT_ID, PHOTO_ID)).toEqual({
      objectKey: `events/${EVENT_ID}/${PHOTO_ID}.jpg`,
      thumbKey: `events/${EVENT_ID}/${PHOTO_ID}_thumb.jpg`,
    })
  })
})

describe('hasJpegHeader', () => {
  it('nhận chữ ký JPEG, loại file khác (ví dụ .exe đổi đuôi)', () => {
    expect(hasJpegHeader(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true)
    expect(hasJpegHeader(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBe(false)
  })
})

describe('parsePhotoCompleteRequest', () => {
  const valid = { eventId: EVENT_ID, photoId: PHOTO_ID, width: 2048, height: 1365, takenAt: '2026-10-25T22:30:00.000Z' }

  it('đọc yêu cầu hợp lệ', () => {
    expect(parsePhotoCompleteRequest(valid)).toEqual(valid)
  })

  it('bỏ ngày chụp sai định dạng nhưng vẫn nhận ảnh', () => {
    expect(parsePhotoCompleteRequest({ ...valid, takenAt: 'hôm qua' })?.takenAt).toBeNull()
  })

  it('từ chối kích thước vô lý', () => {
    expect(parsePhotoCompleteRequest({ ...valid, width: 0 })).toBeNull()
  })
})
