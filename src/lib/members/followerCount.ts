import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function countFollowers(memberId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { count } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('followee_id', memberId)
  return count ?? 0
}
