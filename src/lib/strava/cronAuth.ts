import { timingSafeEqual } from 'node:crypto'
import { getCronSecret } from '@/lib/strava/env'

export function isAuthorizedCron(request: Request): boolean {
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${getCronSecret()}`)
  return received.length === expected.length && timingSafeEqual(received, expected)
}
