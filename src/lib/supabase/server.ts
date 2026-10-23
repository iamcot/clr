import 'server-only'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import { cookies } from 'next/headers'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component không ghi được cookie; phiên được làm mới ở proxy (task 2.2)
        }
      },
    },
  })
}
