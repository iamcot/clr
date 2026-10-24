import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseClubDisplayMode, type ClubDisplayMode } from '@/lib/settings/clubDisplayMode'

export async function loadClubDisplayMode(): Promise<ClubDisplayMode> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'club_display_mode').maybeSingle()
  return parseClubDisplayMode(data?.value)
}
