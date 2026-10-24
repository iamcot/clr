import { describe, expect, it } from 'vitest'
import { readExifTakenAt } from '@/lib/storage/exifDate'

// JPEG tối thiểu: SOI + APP1 (Exif, little-endian) với IFD0 chứa con trỏ tới Exif IFD có DateTimeOriginal
function buildJpegWithExif(dateText: string | null): ArrayBuffer {
  const text = dateText ? `${dateText}\0` : ''
  const tiff = new Uint8Array(8 + 2 + 12 + 4 + 2 + 12 + 4 + text.length)
  const view = new DataView(tiff.buffer)
  tiff.set([0x49, 0x49, 0x2a, 0x00])
  view.setUint32(4, 8, true)
  view.setUint16(8, 1, true)
  view.setUint16(10, 0x8769, true)
  view.setUint16(12, 4, true)
  view.setUint32(14, 1, true)
  view.setUint32(18, 26, true)
  view.setUint32(22, 0, true)
  view.setUint16(26, dateText ? 1 : 0, true)
  if (dateText) {
    view.setUint16(28, 0x9003, true)
    view.setUint16(30, 2, true)
    view.setUint32(32, text.length, true)
    view.setUint32(36, 44, true)
    for (let index = 0; index < text.length; index += 1) tiff[44 + index] = text.charCodeAt(index)
  }
  const app1Length = 2 + 6 + tiff.length
  const file = new Uint8Array(2 + 2 + app1Length + 2)
  const fileView = new DataView(file.buffer)
  fileView.setUint16(0, 0xffd8)
  fileView.setUint16(2, 0xffe1)
  fileView.setUint16(4, app1Length)
  file.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 6)
  file.set(tiff, 12)
  fileView.setUint16(file.length - 2, 0xffd9)
  return file.buffer
}

describe('readExifTakenAt', () => {
  it('đọc DateTimeOriginal và đổi sang UTC theo giờ Việt Nam', () => {
    expect(readExifTakenAt(buildJpegWithExif('2026:10:26 05:30:00'))).toBe('2026-10-25T22:30:00.000Z')
  })

  it('không có DateTimeOriginal thì null', () => {
    expect(readExifTakenAt(buildJpegWithExif(null))).toBeNull()
  })

  it('không phải JPEG hoặc file hỏng thì null', () => {
    expect(readExifTakenAt(new Uint8Array([1, 2, 3]).buffer)).toBeNull()
    expect(readExifTakenAt(new ArrayBuffer(0))).toBeNull()
  })
})
