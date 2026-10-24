import 'server-only'
import { vietnamDate } from '@/lib/stats/periods'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Ngày (giờ VN) có hoạt động được tính của chính mình trong khoảng [fromDate, toDate)
export async function loadOwnActiveDates(
  memberId: string,
  sharePrivateInTotals: boolean,
  fromDate: string,
  toDate: string,
): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('activities')
    .select('start_date, private, visibility')
    .eq('member_id', memberId)
    .eq('counts_for_club', true)
    .gte('start_date', `${fromDate}T00:00:00+07:00`)
    .lt('start_date', `${toDate}T00:00:00+07:00`)
  return (data ?? [])
    .filter((row) => sharePrivateInTotals || !(row.private || row.visibility === 'only_me'))
    .map((row) => vietnamDate(new Date(row.start_date)))
}
