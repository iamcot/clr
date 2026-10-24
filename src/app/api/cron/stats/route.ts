import { NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/strava/cronAuth'
import { recomputeAllStats } from '@/lib/stats/refreshStats'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json(await recomputeAllStats(createSupabaseServiceClient()))
}
