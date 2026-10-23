import { NextResponse } from 'next/server'
import { runBackfillJob } from '@/lib/strava/backfillJob'
import { isAuthorizedCron } from '@/lib/strava/cronAuth'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json(await runBackfillJob())
}
