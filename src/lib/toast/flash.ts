import { FLASH_TOASTS, type FlashCode, type ToastMessage } from '@/config/toasts'

export function parseFlashCode(value: string | undefined): ToastMessage | null {
  if (!value || !Object.hasOwn(FLASH_TOASTS, value)) return null
  return FLASH_TOASTS[value as FlashCode]
}
