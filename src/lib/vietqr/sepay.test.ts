import { describe, expect, it } from 'vitest'
import { isValidSepayAuth, parseSepayEvent } from '@/lib/vietqr/sepay'

const BODY = {
  id: 92704,
  gateway: 'MBBank',
  transactionDate: '2026-10-24 14:02:37',
  accountNumber: '0123456789',
  transferType: 'in',
  transferAmount: 100000,
  content: 'CLR0002 2UESGE',
  referenceCode: 'MBVCB.1',
}

describe('parseSepayEvent', () => {
  it('đọc giao dịch tiền vào, giờ theo giờ Việt Nam', () => {
    const event = parseSepayEvent(BODY)
    expect(event).toMatchObject({
      provider: 'sepay',
      txnId: '92704',
      direction: 'in',
      amount: 100000,
      content: 'CLR0002 2UESGE',
      accountNo: '0123456789',
      transferredAt: '2026-10-24T07:02:37.000Z',
    })
  })

  it('từ chối thiếu id, số tiền sai hoặc giờ sai', () => {
    expect(parseSepayEvent({ ...BODY, id: undefined })).toBeNull()
    expect(parseSepayEvent({ ...BODY, transferAmount: 0 })).toBeNull()
    expect(parseSepayEvent({ ...BODY, transferType: 'x' })).toBeNull()
    expect(parseSepayEvent({ ...BODY, transactionDate: 'hôm qua' })).toBeNull()
    expect(parseSepayEvent(null)).toBeNull()
  })
})

describe('isValidSepayAuth', () => {
  it('chỉ nhận đúng khoá', () => {
    expect(isValidSepayAuth('Apikey secret', 'secret')).toBe(true)
    expect(isValidSepayAuth('Apikey wrong', 'secret')).toBe(false)
    expect(isValidSepayAuth(null, 'secret')).toBe(false)
    expect(isValidSepayAuth('Apikey ', '')).toBe(false)
  })
})
