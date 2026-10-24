import { fromVietnamInputValue } from '@/lib/format/dateTime'
import { isUuid } from '@/lib/storage/uploadRules'

export type ManualTransactionInput = {
  accountId: string
  amount: number
  categoryId: string
  occurredAt: string | null
  description: string
  receiptUrl: string | null
}

export type ManualTransactionParse = { ok: true; value: ManualTransactionInput } | { ok: false; message: string }

const MAX_AMOUNT = 100_000_000_000
const MAX_DESCRIPTION_LENGTH = 300

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

// Số tiền nhập có thể kèm dấu chấm hoặc phẩy ngăn cách nghìn
export function parseAmount(value: string, allowZero = false): number | null {
  const digits = value.replace(/[.,\s]/g, '')
  if (!/^\d+$/.test(digits)) return null
  const amount = Number(digits)
  return (amount > 0 || allowZero) && amount <= MAX_AMOUNT ? amount : null
}

export function parseManualTransaction(formData: FormData): ManualTransactionParse {
  const accountId = text(formData, 'account_id')
  if (!isUuid(accountId)) return { ok: false, message: 'Chọn tài khoản' }
  const amount = parseAmount(text(formData, 'amount'))
  if (!amount) return { ok: false, message: 'Số tiền phải là số nguyên dương' }
  const categoryId = text(formData, 'category_id')
  if (!isUuid(categoryId)) return { ok: false, message: 'Chọn danh mục' }
  const occurredText = text(formData, 'occurred_at')
  const occurredAt = occurredText ? fromVietnamInputValue(occurredText) : null
  if (occurredText && !occurredAt) return { ok: false, message: 'Thời điểm không hợp lệ' }
  const receiptUrl = text(formData, 'receipt_url')
  return {
    ok: true,
    value: {
      accountId,
      amount,
      categoryId,
      occurredAt,
      description: text(formData, 'description').slice(0, MAX_DESCRIPTION_LENGTH),
      receiptUrl: receiptUrl || null,
    },
  }
}
