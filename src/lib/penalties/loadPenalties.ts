import 'server-only'
import { PENALTY_LIST_LIMIT, type PenaltyStatus } from '@/config/penalties'
import { monthRangeVn } from '@/lib/penalties/calc'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PenaltyFilters = {
  status?: string
  typeCode?: string
  month?: string
  query?: string
}

export type PenaltyListRow = {
  id: string
  memberId: string
  memberName: string
  memberCode: string
  typeCode: string
  typeName: string
  amount: number
  reason: string
  status: PenaltyStatus
  createdAt: string
  paidAt: string | null
  paidMethod: string | null
  paymentRef: string | null
  waivedReason: string | null
}

const SELECT = '*, penalty_types(code, name), members!penalties_member_id_fkey(display_name, member_code)'

export async function loadPenalties(filters: PenaltyFilters): Promise<PenaltyListRow[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('penalties')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(PENALTY_LIST_LIMIT)
  if (filters.status === 'unpaid' || filters.status === 'paid' || filters.status === 'waived') {
    query = query.eq('status', filters.status)
  }
  const range = filters.month ? monthRangeVn(filters.month) : null
  if (range) query = query.gte('created_at', range.from).lt('created_at', range.to)

  const { data } = await query
  const needle = filters.query?.trim().toLowerCase()
  return (data ?? [])
    .map((row) => ({
      id: row.id,
      memberId: row.member_id,
      memberName: row.members?.display_name ?? 'Thành viên',
      memberCode: row.members?.member_code ?? '',
      typeCode: row.penalty_types?.code ?? '',
      typeName: row.penalty_types?.name ?? '',
      amount: Number(row.amount),
      reason: row.reason,
      status: row.status as PenaltyStatus,
      createdAt: row.created_at,
      paidAt: row.paid_at,
      paidMethod: row.paid_method,
      paymentRef: row.payment_ref,
      waivedReason: row.waived_reason,
    }))
    .filter((row) => !filters.typeCode || row.typeCode === filters.typeCode)
    .filter(
      (row) =>
        !needle || row.memberName.toLowerCase().includes(needle) || row.memberCode.toLowerCase().includes(needle),
    )
}
