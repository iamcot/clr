import { NextResponse, type NextRequest } from 'next/server'
import { processBankEvent } from '@/lib/fund/processBankEvent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getSepayApiKey } from '@/lib/vietqr/env'
import { isValidSepayAuth, parseSepayEvent } from '@/lib/vietqr/sepay'

export const maxDuration = 30

// SePay chờ phản hồi 200 kèm { success: true }; lỗi xử lý trả 500 để SePay gửi lại (giao dịch đã ghi thì không bị cộng hai lần)
export async function POST(request: NextRequest) {
  if (!isValidSepayAuth(request.headers.get('authorization'), getSepayApiKey())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const event = parseSepayEvent(await request.json().catch(() => null))
  if (!event) return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 })

  try {
    await processBankEvent(createSupabaseServiceClient(), event)
  } catch (error) {
    console.error('Xử lý webhook SePay thất bại', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
