import 'server-only'
import { OVERVIEW_ACTIVITY_DAYS } from '@/config/members'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000

export type AdminOverview = {
  activeMembers: number
  pendingMembers: number
  recentActivities: number
}

export async function loadAdminOverview(now: Date): Promise<AdminOverview> {
  const supabase = await createSupabaseServerClient()
  const since = new Date(now.getTime() - OVERVIEW_ACTIVITY_DAYS * DAY_MS).toISOString()
  const [active, pending, activities] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('activities_review')
      .select('id', { count: 'exact', head: true })
      .eq('counts_for_club', true)
      .gte('start_date', since),
  ])
  return {
    activeMembers: active.count ?? 0,
    pendingMembers: pending.count ?? 0,
    recentActivities: activities.count ?? 0,
  }
}
