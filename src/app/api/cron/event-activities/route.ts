import { NextResponse } from 'next/server'
import { linkRecentEventActivities } from '@/lib/events/linkEventActivities'
import { isAuthorizedCron } from '@/lib/strava/cronAuth'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 })
  const linked = await linkRecentEventActivities(createSupabaseServiceClient(), new Date())
  return NextResponse.json({ linked })
}
