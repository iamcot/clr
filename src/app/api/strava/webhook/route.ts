import { after, NextResponse, type NextRequest } from 'next/server'
import { getWebhookVerifyToken } from '@/lib/strava/env'
import { runStravaEventJob } from '@/lib/strava/eventJob'
import { recordStravaEvent } from '@/lib/strava/eventStore'
import { parseWebhookEvent } from '@/lib/strava/webhookEvent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams
  const isValid = query.get('hub.mode') === 'subscribe' && query.get('hub.verify_token') === getWebhookVerifyToken()
  if (!isValid) return new NextResponse('Forbidden', { status: 403 })
  return NextResponse.json({ 'hub.challenge': query.get('hub.challenge') })
}

// Strava yêu cầu trả 200 trong 2 giây: chỉ ghi event, việc gọi Strava làm sau khi đã phản hồi
export async function POST(request: NextRequest) {
  const event = parseWebhookEvent(await request.json().catch(() => null))
  if (!event) return new NextResponse('Bad Request', { status: 400 })

  await recordStravaEvent(createSupabaseServiceClient(), event)
  after(async () => {
    try {
      await runStravaEventJob()
    } catch (error) {
      console.error('Xử lý event Strava thất bại, cron sẽ thử lại', error)
    }
  })
  return new NextResponse(null, { status: 200 })
}
