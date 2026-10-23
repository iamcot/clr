export type TabIcon = 'home' | 'challenge' | 'event' | 'fund' | 'me'

export type NavTab = {
  href: string
  label: string
  icon: TabIcon
  enabled: boolean
}

export const NAV_TABS: NavTab[] = [
  { href: '/', label: 'Trang chủ', icon: 'home', enabled: true },
  { href: '/challenges', label: 'Challenge', icon: 'challenge', enabled: false },
  { href: '/events', label: 'Event', icon: 'event', enabled: false },
  { href: '/fund', label: 'Quỹ', icon: 'fund', enabled: false },
  { href: '/me', label: 'Tôi', icon: 'me', enabled: true },
]
