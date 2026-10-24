import { describe, expect, it, vi } from 'vitest'
import { processBankEvent } from '@/lib/fund/processBankEvent'
import type { BankTransferEvent } from '@/lib/vietqr/sepay'

vi.mock('server-only', () => ({}))

const EVENT: BankTransferEvent = {
  provider: 'sepay',
  txnId: '1',
  direction: 'in',
  amount: 100000,
  content: 'MBVCB.1 CLR0002 2UESGE',
  accountNo: '0123456789',
  transferredAt: '2026-10-24T07:00:00.000Z',
  raw: {},
}

type Recorded = { event_id: string; is_new: boolean; processed: boolean }

function fakeDb(recorded: Recorded, intents: { id: string; ref: string; amount: number; status: string }[]) {
  const rpc = vi.fn(async (name: string) => {
    if (name === 'record_bank_event') return { data: [recorded], error: null }
    return { data: null, error: null }
  })
  const query = {
    select: () => query,
    eq: () => query,
    gte: () => query,
    limit: async () => ({ data: intents }),
    maybeSingle: async () => ({ data: { id: 'member-7' } }),
  }
  const db = { rpc, from: vi.fn(() => query) }
  return { db: db as unknown as Parameters<typeof processBankEvent>[0], rpc }
}

describe('processBankEvent', () => {
  it('khớp mã và đủ tiền thì đánh dấu đã nộp', async () => {
    const { db, rpc } = fakeDb({ event_id: 'e1', is_new: true, processed: false }, [
      { id: 'i1', ref: '2UESGE', amount: 100000, status: 'pending' },
    ])
    await processBankEvent(db, EVENT)
    expect(rpc).toHaveBeenLastCalledWith('finish_bank_event', {
      p_event_id: 'e1',
      p_status: 'paid',
      p_intent_id: 'i1',
      p_member_id: null,
    })
  })

  it('webhook gửi lại đã xử lý xong thì không xử lý lần nữa', async () => {
    const { db, rpc } = fakeDb({ event_id: 'e1', is_new: false, processed: true }, [])
    await processBankEvent(db, EVENT)
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('webhook gửi lại nhưng lần trước chưa xử lý xong thì xử lý nốt', async () => {
    const { db, rpc } = fakeDb({ event_id: 'e1', is_new: false, processed: false }, [
      { id: 'i1', ref: '2UESGE', amount: 100000, status: 'pending' },
    ])
    await processBankEvent(db, EVENT)
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('có mã thành viên nhưng không có mã nộp thì chờ xử lý tay kèm gợi ý', async () => {
    const { db, rpc } = fakeDb({ event_id: 'e2', is_new: true, processed: false }, [])
    await processBankEvent(db, { ...EVENT, content: 'CLR0007 dong quy' })
    expect(rpc).toHaveBeenLastCalledWith('finish_bank_event', {
      p_event_id: 'e2',
      p_status: 'needs_review',
      p_intent_id: null,
      p_member_id: 'member-7',
    })
  })

  it('tiền ra được bỏ qua', async () => {
    const { db, rpc } = fakeDb({ event_id: 'e3', is_new: true, processed: false }, [])
    await processBankEvent(db, { ...EVENT, direction: 'out' })
    expect(rpc).toHaveBeenLastCalledWith('finish_bank_event', {
      p_event_id: 'e3',
      p_status: 'ignored',
      p_intent_id: null,
      p_member_id: null,
    })
  })
})
