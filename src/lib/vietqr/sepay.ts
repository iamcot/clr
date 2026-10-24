import { timingSafeEqual } from 'node:crypto'

export type BankTransferEvent = {
  provider: 'sepay'
  txnId: string
  direction: 'in' | 'out'
  amount: number
  content: string
  accountNo: string
  transferredAt: string
  raw: Record<string, unknown>
}

const VN_OFFSET = '+07:00'

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

// SePay gửi giờ giao dịch dạng "2026-10-24 14:02:37" theo giờ Việt Nam
function parseTransactionDate(value: unknown): string | null {
  const text = textOf(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(text)) return null
  const date = new Date(`${text.replace(' ', 'T')}${VN_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function parseSepayEvent(body: unknown): BankTransferEvent | null {
  if (typeof body !== 'object' || body === null) return null
  const raw = body as Record<string, unknown>
  const id = raw.id
  const direction = raw.transferType === 'in' || raw.transferType === 'out' ? raw.transferType : null
  const amount = Number(raw.transferAmount)
  const transferredAt = parseTransactionDate(raw.transactionDate)
  const hasId = (typeof id === 'number' || typeof id === 'string') && String(id) !== ''
  if (!hasId || !direction || !Number.isInteger(amount) || amount <= 0 || !transferredAt) return null
  return {
    provider: 'sepay',
    txnId: String(id),
    direction,
    amount,
    content: textOf(raw.content) || textOf(raw.description),
    accountNo: textOf(raw.accountNumber),
    transferredAt,
    raw,
  }
}

// SePay gọi webhook với header "Authorization: Apikey <khoá>"
export function isValidSepayAuth(header: string | null, apiKey: string): boolean {
  if (!header || !apiKey) return false
  const expected = Buffer.from(`Apikey ${apiKey}`)
  const received = Buffer.from(header.trim())
  return received.length === expected.length && timingSafeEqual(received, expected)
}
