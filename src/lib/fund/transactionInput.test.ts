import { describe, expect, it } from 'vitest'
import { parseAmount, parseManualTransaction } from '@/lib/fund/transactionInput'

const ID = '6f1c1d5e-0a7b-4c8e-9d2f-3b4a5c6d7e8f'

function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

const VALID = { account_id: ID, amount: '1.500.000', category_id: ID, description: ' Mua áo ' }

describe('parseAmount', () => {
  it('đọc số có dấu ngăn cách nghìn', () => {
    expect(parseAmount('1.500.000')).toBe(1_500_000)
    expect(parseAmount('2,000')).toBe(2000)
  })

  it('từ chối rỗng, số âm, số thập phân kiểu chữ', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('-5')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('0')).toBeNull()
  })
})

describe('parseManualTransaction', () => {
  it('nhận dữ liệu hợp lệ', () => {
    expect(parseManualTransaction(form(VALID))).toEqual({
      ok: true,
      value: {
        accountId: ID,
        amount: 1_500_000,
        categoryId: ID,
        occurredAt: null,
        description: 'Mua áo',
        receiptUrl: null,
      },
    })
  })

  it('đọc thời điểm theo giờ Việt Nam', () => {
    const parsed = parseManualTransaction(form({ ...VALID, occurred_at: '2026-10-24T09:30' }))
    expect(parsed.ok && parsed.value.occurredAt).toBe('2026-10-24T02:30:00.000Z')
  })

  it('từ chối thiếu tài khoản, số tiền sai hoặc thiếu danh mục', () => {
    expect(parseManualTransaction(form({ ...VALID, account_id: '' })).ok).toBe(false)
    expect(parseManualTransaction(form({ ...VALID, amount: '0' })).ok).toBe(false)
    expect(parseManualTransaction(form({ ...VALID, category_id: '' })).ok).toBe(false)
    expect(parseManualTransaction(form({ ...VALID, occurred_at: 'mai' })).ok).toBe(false)
  })
})
