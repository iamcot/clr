import { NextResponse } from 'next/server'
import { canViewDraw, loadDrawState } from '@/lib/draw/loadDraw'
import { isUuid } from '@/lib/storage/uploadRules'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const state = isUuid(id) && (await canViewDraw(id)) ? await loadDrawState(id) : null
  if (!state) return NextResponse.json({ error: 'Không tìm thấy đợt quay số' }, { status: 404 })
  return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } })
}
