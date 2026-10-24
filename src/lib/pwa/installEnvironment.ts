export type InstallEnvironment = 'installed' | 'in_app_browser' | 'ios_safari' | 'installable' | 'unsupported'

const IN_APP_BROWSER_PATTERN = /Zalo|FBAN|FBAV|FB_IAB|Instagram|Line\/|MessengerLite|Messenger|TikTok|Twitter/i
const IOS_PATTERN = /iPhone|iPad|iPod/i
const IOS_OTHER_BROWSER_PATTERN = /CriOS|FxiOS|EdgiOS|OPiOS/i

// Phân loại môi trường để chọn thẻ hướng dẫn cài; 'installable' nghĩa là trình duyệt có thể bắn beforeinstallprompt
export function detectInstallEnvironment(userAgent: string, isStandalone: boolean): InstallEnvironment {
  if (isStandalone) return 'installed'
  if (IN_APP_BROWSER_PATTERN.test(userAgent)) return 'in_app_browser'
  if (IOS_PATTERN.test(userAgent)) return IOS_OTHER_BROWSER_PATTERN.test(userAgent) ? 'unsupported' : 'ios_safari'
  return /Android|Chrome|Edg\//i.test(userAgent) ? 'installable' : 'unsupported'
}

const DAY_MS = 24 * 3600 * 1000
export const INSTALL_DISMISS_DAYS = 30

export function isInstallPromptDismissed(dismissedAtMs: number | null, nowMs: number): boolean {
  if (dismissedAtMs === null || Number.isNaN(dismissedAtMs)) return false
  return nowMs - dismissedAtMs < INSTALL_DISMISS_DAYS * DAY_MS
}
