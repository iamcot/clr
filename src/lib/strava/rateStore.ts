import 'server-only'
import type { RateSnapshot, RateWindowName } from '@/lib/strava/rateLimit'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

export function createSupabaseRateStore(db: ServiceClient) {
  return {
    async load(): Promise<RateSnapshot> {
      const { data, error } = await db.from('strava_rate_state').select('*')
      if (error) throw new Error(`Không đọc được hạn mức Strava: ${error.message}`)

      const snapshot: RateSnapshot = {}
      for (const row of data) {
        snapshot[row.window_name as RateWindowName] = {
          limit: row.request_limit,
          usage: row.usage,
          updatedAt: new Date(row.updated_at),
        }
      }
      return snapshot
    },

    async save(snapshot: RateSnapshot): Promise<void> {
      const rows = Object.entries(snapshot).map(([windowName, window]) => ({
        window_name: windowName as RateWindowName,
        request_limit: window.limit,
        usage: window.usage,
        updated_at: window.updatedAt.toISOString(),
      }))
      if (rows.length === 0) return
      const { error } = await db.from('strava_rate_state').upsert(rows)
      if (error) throw new Error(`Không lưu được hạn mức Strava: ${error.message}`)
    },
  }
}
