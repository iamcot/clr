const EXIF_IFD_POINTER_TAG = 0x8769
const DATE_TIME_ORIGINAL_TAG = 0x9003
const ASCII_TYPE = 2
const VN_OFFSET = '+07:00'

type Reader = { view: DataView; tiffStart: number; littleEndian: boolean }

function readU16(reader: Reader, offset: number): number {
  return reader.view.getUint16(reader.tiffStart + offset, reader.littleEndian)
}

function readU32(reader: Reader, offset: number): number {
  return reader.view.getUint32(reader.tiffStart + offset, reader.littleEndian)
}

function findExifSegment(view: DataView): number | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null
  let offset = 2
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null
    const marker = view.getUint8(offset + 1)
    const length = view.getUint16(offset + 2)
    const isExif = marker === 0xe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966
    if (isExif) return offset + 10
    offset += 2 + length
  }
  return null
}

function readAscii(reader: Reader, offset: number, length: number): string {
  let text = ''
  for (let index = 0; index < length; index += 1) {
    const code = reader.view.getUint8(reader.tiffStart + offset + index)
    if (code === 0) break
    text += String.fromCharCode(code)
  }
  return text
}

function findTagInIfd(reader: Reader, ifdOffset: number, tag: number): { type: number; count: number; valueOffset: number } | null {
  const entryCount = readU16(reader, ifdOffset)
  for (let index = 0; index < entryCount; index += 1) {
    const entry = ifdOffset + 2 + index * 12
    if (readU16(reader, entry) === tag) {
      return { type: readU16(reader, entry + 2), count: readU32(reader, entry + 4), valueOffset: readU32(reader, entry + 8) }
    }
  }
  return null
}

function toIso(exifDate: string): string | null {
  const match = exifDate.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const time = Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${VN_OFFSET}`)
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}

// Ngày chụp (DateTimeOriginal) của ảnh JPEG; EXIF không có múi giờ nên coi là giờ Việt Nam. Lỗi đọc thì trả null
export function readExifTakenAt(buffer: ArrayBuffer): string | null {
  try {
    const view = new DataView(buffer)
    const tiffStart = findExifSegment(view)
    if (tiffStart === null) return null
    const reader: Reader = { view, tiffStart, littleEndian: view.getUint16(tiffStart) === 0x4949 }
    const exifPointer = findTagInIfd(reader, readU32(reader, 4), EXIF_IFD_POINTER_TAG)
    if (!exifPointer) return null
    const original = findTagInIfd(reader, exifPointer.valueOffset, DATE_TIME_ORIGINAL_TAG)
    if (!original || original.type !== ASCII_TYPE) return null
    return toIso(readAscii(reader, original.valueOffset, original.count))
  } catch {
    return null
  }
}
