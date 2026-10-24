'use server'

import { revalidatePath } from 'next/cache'
import { requireBcn } from '@/lib/auth/requireBcn'
import { buildFundCloseSummaryPost } from '@/lib/finance/summaryPost'
import { loadFundReport } from '@/lib/finance/loadFinance'
import { monthStartDate, parseReportPeriod } from '@/lib/finance/period'
import { insertSystemPost } from '@/lib/posts/autoPosts'
import { isUuid } from '@/lib/storage/uploadRules'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

const AUTOPOST_SETTING_KEY = 'fund_close_autopost'

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

function refreshReportPages() {
  revalidatePath('/admin/fund')
  revalidatePath('/admin/fund/reports')
  revalidatePath('/fund/club')
  revalidatePath('/')
}

async function isAutopostEnabled(): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('key', AUTOPOST_SETTING_KEY).maybeSingle()
  return data?.value !== false
}

async function postCloseSummary(monthKey: string) {
  const period = parseReportPeriod(monthKey)
  if (!period) return
  const report = await loadFundReport(period.from, period.to)
  await insertSystemPost(
    createSupabaseServiceClient(),
    `fund-close:${monthKey}`,
    'system',
    buildFundCloseSummaryPost(period.label, report),
    new Date(),
  )
}

export async function lockFundMonth(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const monthKey = text(formData, 'month')
  const monthStart = monthStartDate(monthKey)
  if (!monthStart) return actionError('Chỉ chốt sổ theo từng tháng')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('lock_fund_month', { p_month: monthStart, p_note: text(formData, 'note') })
  if (error) {
    return actionError(error.message.includes('đã qua') ? 'Chỉ chốt được tháng đã qua' : 'Không chốt được sổ, tháng này có thể đã chốt')
  }
  let posted = false
  if (await isAutopostEnabled()) {
    try {
      await postCloseSummary(monthKey)
      posted = true
    } catch (postError) {
      console.error('Không đăng được bài tóm tắt quỹ', postError)
    }
  }
  refreshReportPages()
  return actionSuccess(posted ? 'Đã chốt sổ và đăng bài tóm tắt lên bảng tin' : 'Đã chốt sổ')
}

export async function unlockFundMonth(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const monthStart = monthStartDate(text(formData, 'month'))
  const reason = text(formData, 'reason')
  if (!monthStart) return actionError('Chỉ mở khoá theo từng tháng')
  if (!reason) return actionError('Mở khoá cần lý do')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('unlock_fund_month', { p_month: monthStart, p_reason: reason })
  if (error) return actionError('Không mở khoá được')
  refreshReportPages()
  return actionSuccess('Đã mở khoá tháng này')
}

export async function setFundCloseAutopost(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ key: AUTOPOST_SETTING_KEY, value: formData.get('enabled') === 'on' })
  if (error) return actionError('Không lưu được cài đặt')
  refreshReportPages()
  return actionSuccess('Đã lưu cài đặt')
}

export async function setReceiptPublic(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const id = text(formData, 'id')
  if (!isUuid(id)) return actionError('Không tìm thấy giao dịch')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('set_fund_receipt_public', { p_id: id, p_public: formData.get('public') === 'true' })
  if (error) return actionError('Không cập nhật được')
  refreshReportPages()
  return actionSuccess('Đã cập nhật')
}
