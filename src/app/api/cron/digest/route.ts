import { NextResponse } from 'next/server'
import { publishLevelDigestPost } from '@/lib/posts/autoPosts'
import { isAuthorizedCron } from '@/lib/strava/cronAuth'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 })
  const created = await publishLevelDigestPost(createSupabaseServiceClient(), new Date())
  return NextResponse.json({ created })
}
