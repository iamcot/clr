import 'server-only'
import { cookies } from 'next/headers'
import { FLASH_COOKIE_MAX_AGE_SECONDS, FLASH_COOKIE_NAME, type FlashCode } from '@/config/toasts'

export async function setFlashToast(code: FlashCode): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(FLASH_COOKIE_NAME, code, {
    path: '/',
    maxAge: FLASH_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    httpOnly: false,
  })
}
