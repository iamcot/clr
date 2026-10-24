import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type FundSettings = {
  bankName: string
  accountNumber: string
  accountHolder: string
  totalsPublic: boolean
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export async function loadFundSettings(): Promise<FundSettings> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['fund_bank_name', 'fund_account_number', 'fund_account_holder', 'penalty_totals_public'])
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  return {
    bankName: textValue(byKey.get('fund_bank_name')),
    accountNumber: textValue(byKey.get('fund_account_number')),
    accountHolder: textValue(byKey.get('fund_account_holder')),
    totalsPublic: byKey.get('penalty_totals_public') !== false,
  }
}
