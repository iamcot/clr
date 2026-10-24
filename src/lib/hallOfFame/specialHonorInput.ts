import { isUuid } from '@/lib/storage/uploadRules'

export type SpecialHonorInput = {
  memberId: string
  title: string
  detail: string
  date: string
  imageUrl: string | null
}

export type SpecialHonorParse = { ok: true; value: SpecialHonorInput } | { ok: false; message: string }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

export function parseSpecialHonor(formData: FormData): SpecialHonorParse {
  const memberId = text(formData, 'member_id')
  if (!isUuid(memberId)) return { ok: false, message: 'Hãy chọn thành viên' }
  const title = text(formData, 'title')
  if (!title) return { ok: false, message: 'Hãy nhập tên danh hiệu' }
  const date = text(formData, 'honor_date')
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, message: 'Ngày không hợp lệ' }
  const imageUrl = text(formData, 'image_url')
  if (imageUrl && !imageUrl.startsWith('https://')) return { ok: false, message: 'Ảnh không hợp lệ' }
  return { ok: true, value: { memberId, title, detail: text(formData, 'detail'), date, imageUrl: imageUrl || null } }
}
