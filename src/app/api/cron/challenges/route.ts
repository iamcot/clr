import { NextResponse } from 'next/server'
import { advanceChallenges } from '@/lib/challenges/advance'
import { isAuthorizedCron } from '@/lib/strava/cronAuth'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export const maxDuration = 300

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json(await advanceChallenges(createSupabaseServiceClient()))
}
