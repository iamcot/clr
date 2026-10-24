import type { ToastMessage } from '@/config/toasts'

export type ActionResult = ToastMessage

export const actionSuccess = (text: string): ActionResult => ({ kind: 'success', text })
export const actionError = (text: string): ActionResult => ({ kind: 'error', text })
