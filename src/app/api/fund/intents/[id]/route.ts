import { NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { loadIntentStatus } from '@/lib/fund/loadPayment'
import { isUuid } from '@/lib/storage/uploadRules'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getCurrentMember()
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const status = isUuid(id) ? await loadIntentStatus(id, new Date()) : null
  if (!status) return NextResponse.json({ error: 'Không tìm thấy lần nộp' }, { status: 404 })
  return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } })
}
