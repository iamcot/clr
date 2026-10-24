import { DRAW_SOURCE_TYPES, type DrawSourceType } from '@/config/draw'
import { isUuid } from '@/lib/storage/uploadRules'

export type PrizeInput = { name: string; quantity: number }

export type DrawInput = {
  title: string
  sourceType: DrawSourceType
  sourceId: string | null
  prizes: PrizeInput[]
}

export type DrawInputParse = { ok: true; value: DrawInput } | { ok: false; message: string }

const MAX_PRIZE_QUANTITY = 100

// Mỗi dòng "Tên giải | số lượng", bỏ phần số lượng thì là 1
export function parsePrizeLines(text: string): PrizeInput[] | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
  if (lines.length === 0) return null
  const prizes: PrizeInput[] = []
  for (const line of lines) {
    const [rawName = '', rawQuantity] = line.split('|').map((part) => part.trim())
    const quantity = rawQuantity === undefined || rawQuantity === '' ? 1 : Number(rawQuantity)
    if (!rawName || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PRIZE_QUANTITY) return null
    prizes.push({ name: rawName, quantity })
  }
  return prizes
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

export function parseDrawInput(formData: FormData): DrawInputParse {
  const title = text(formData, 'title')
  if (!title) return { ok: false, message: 'Hãy nhập tên đợt quay số' }
  const sourceType = DRAW_SOURCE_TYPES.find((type) => type === text(formData, 'source_type'))
  if (!sourceType) return { ok: false, message: 'Nguồn danh sách không hợp lệ' }
  const sourceId = text(formData, sourceType === 'event_checked_in' ? 'event_id' : 'challenge_id')
  if (sourceType !== 'manual' && !isUuid(sourceId)) return { ok: false, message: 'Hãy chọn challenge hoặc event' }
  const prizes = parsePrizeLines(text(formData, 'prizes'))
  if (!prizes) return { ok: false, message: 'Mỗi giải một dòng, dạng “Tên giải | số lượng”' }
  return { ok: true, value: { title, sourceType, sourceId: sourceType === 'manual' ? null : sourceId, prizes } }
}
