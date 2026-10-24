import { describe, expect, it } from 'vitest'
import { matchTransfer, normalizeTransferContent, type CandidateIntent } from '@/lib/vietqr/match'

const INTENT: CandidateIntent = { id: 'i1', ref: '2UESGE', amount: 100000, status: 'pending' }

function incoming(content: string, amount = 100000) {
  return { direction: 'in' as const, amount, content }
}

describe('matchTransfer', () => {
  it('khớp mã và đủ tiền thì đã nộp', () => {
    expect(matchTransfer(incoming('CLR0002 2UESGE'), [INTENT])).toEqual({ kind: 'paid', intentId: 'i1' })
  })

  it('chịu được tiền tố ngân hàng, chữ thường, thiếu khoảng trắng và dấu gạch', () => {
    expect(matchTransfer(incoming('MBVCB.123456.clr0002 2uesge.CT tu NGUYEN VAN A'), [INTENT]).kind).toBe('paid')
    expect(matchTransfer(incoming('CLR00022UESGE'), [INTENT]).kind).toBe('paid')
    expect(matchTransfer(incoming('CLR0002-2UE-SGE'), [INTENT]).kind).toBe('paid')
  })

  it('khớp mã nhưng thiếu hoặc thừa tiền thì lệch tiền', () => {
    expect(matchTransfer(incoming('CLR0002 2UESGE', 90000), [INTENT])).toEqual({ kind: 'mismatch', intentId: 'i1' })
    expect(matchTransfer(incoming('CLR0002 2UESGE', 110000), [INTENT])).toEqual({ kind: 'mismatch', intentId: 'i1' })
  })

  it('chuyển lần hai cùng mã thì báo trùng', () => {
    expect(matchTransfer(incoming('CLR0002 2UESGE'), [{ ...INTENT, status: 'paid' }])).toEqual({
      kind: 'duplicate',
      intentId: 'i1',
    })
  })

  it('lần nộp hết hạn vẫn khớp nếu đủ tiền', () => {
    expect(matchTransfer(incoming('CLR0002 2UESGE'), [{ ...INTENT, status: 'expired' }]).kind).toBe('paid')
  })

  it('lần nộp đã huỷ thì chờ xử lý tay', () => {
    expect(matchTransfer(incoming('CLR0002 2UESGE'), [{ ...INTENT, status: 'cancelled' }]).kind).toBe('mismatch')
  })

  it('không có mã nhưng có mã thành viên thì gợi ý thành viên', () => {
    expect(matchTransfer(incoming('CLR0007 dong quy'), [INTENT])).toEqual({ kind: 'member_hint', memberCode: 'CLR0007' })
  })

  it('không khớp gì thì không phân loại', () => {
    expect(matchTransfer(incoming('Tien an trua'), [INTENT])).toEqual({ kind: 'none' })
  })

  it('tiền ra bị bỏ qua', () => {
    expect(matchTransfer({ direction: 'out', amount: 1000, content: 'CLR0002 2UESGE' }, [INTENT])).toEqual({ kind: 'ignored' })
  })
})

describe('normalizeTransferContent', () => {
  it('bỏ dấu, ký tự đặc biệt và đổi sang chữ hoa', () => {
    expect(normalizeTransferContent('Nộp phạt: clr-0002')).toBe('NOPPHATCLR0002')
  })
})
