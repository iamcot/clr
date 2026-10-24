import { describe, expect, it } from 'vitest'
import { detectInstallEnvironment, isInstallPromptDismissed } from '@/lib/pwa/installEnvironment'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IPHONE_ZALO = `${IPHONE_SAFARI} Zalo/22.1`
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const ANDROID_FACEBOOK = `${ANDROID_CHROME} [FB_IAB/FB4A;FBAV/450.0]`

describe('detectInstallEnvironment', () => {
  it('đã chạy standalone thì không hướng dẫn nữa', () => {
    expect(detectInstallEnvironment(IPHONE_SAFARI, true)).toBe('installed')
  })

  it('iPhone Safari cần hướng dẫn thủ công', () => {
    expect(detectInstallEnvironment(IPHONE_SAFARI, false)).toBe('ios_safari')
  })

  it('trình duyệt trong Zalo hay Facebook yêu cầu mở bằng trình duyệt khác', () => {
    expect(detectInstallEnvironment(IPHONE_ZALO, false)).toBe('in_app_browser')
    expect(detectInstallEnvironment(ANDROID_FACEBOOK, false)).toBe('in_app_browser')
  })

  it('Android Chrome cài được qua prompt', () => {
    expect(detectInstallEnvironment(ANDROID_CHROME, false)).toBe('installable')
  })
})

describe('isInstallPromptDismissed', () => {
  const now = Date.parse('2026-11-30T00:00:00Z')

  it('chưa tắt bao giờ thì hiện', () => {
    expect(isInstallPromptDismissed(null, now)).toBe(false)
  })

  it('tắt trong 30 ngày thì ẩn, quá 30 ngày thì hiện lại', () => {
    expect(isInstallPromptDismissed(Date.parse('2026-11-10T00:00:00Z'), now)).toBe(true)
    expect(isInstallPromptDismissed(Date.parse('2026-10-30T00:00:00Z'), now)).toBe(false)
  })
})
