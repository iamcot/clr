import { NextResponse } from 'next/server'
import { getBcnMember } from '@/lib/auth/requireBcn'
import { linkEventActivities } from '@/lib/events/linkEventActivities'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { setFlashToast } from '@/lib/toast/setFlash'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getBcnMember())) return new NextResponse('Forbidden', { status: 403 })

  const { id } = await params
  const client = createSupabaseServiceClient()
  const { data: event } = await client.from('events').select('*').eq('id', id).maybeSingle()
  if (event) await linkEventActivities(client, event)
  await setFlashToast('activities_linked')
  return NextResponse.redirect(new URL(`/admin/events/${id}`, request.url), 303)
}
