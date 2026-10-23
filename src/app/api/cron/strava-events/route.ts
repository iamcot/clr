import { NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/strava/cronAuth'
import { runStravaEventJob } from '@/lib/strava/eventJob'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 })
  const processed = await runStravaEventJob()
  return NextResponse.json({ processed })
}
