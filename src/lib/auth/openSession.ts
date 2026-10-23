import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// Email giả chưa từng gửi thư: lấy token_hash từ admin rồi tự xác thực để Supabase set cookie phiên
export async function openSessionForEmail(email: string): Promise<void> {
  const { data, error } = await createSupabaseServiceClient().auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !data.properties) throw new Error(`Không tạo được link đăng nhập: ${error?.message}`)

  const supabase = await createSupabaseServerClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: data.properties.hashed_token,
  })
  if (verifyError) throw new Error(`Không mở được phiên: ${verifyError.message}`)
}
