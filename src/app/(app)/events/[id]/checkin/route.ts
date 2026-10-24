import { NextResponse } from 'next/server'
import { CHECKIN_CLOSES_AFTER_MS, CHECKIN_OPENS_BEFORE_MS } from '@/config/events'
import type { FlashCode } from '@/config/toasts'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { isCheckinOpen } from '@/lib/events/eventTime'
import { loadEventDetail } from '@/lib/events/loadEvents'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { setFlashToast } from '@/lib/toast/setFlash'

async function checkIn(eventId: string, code: string): Promise<FlashCode> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('self_check_in', { p_event_id: eventId, p_code: code })
  if (error?.message.includes('code_expired')) return 'checkin_expired'
  if (error) return 'checkin_failed'
  return data === 'already' ? 'checkin_already' : 'checkin_done'
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventUrl = new URL(`/events/${id}`, request.url)
  const member = await getCurrentMember()
  if (!member || member.status !== 'active') return NextResponse.redirect(new URL('/login', request.url))

  const event = await loadEventDetail(id, member.id)
  const open = event && isCheckinOpen(event, new Date(), CHECKIN_OPENS_BEFORE_MS, CHECKIN_CLOSES_AFTER_MS)
  const code = new URL(request.url).searchParams.get('code') ?? ''
  await setFlashToast(open ? await checkIn(id, code) : 'checkin_closed')
  return NextResponse.redirect(eventUrl)
}
