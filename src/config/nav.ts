export type TabIcon = 'home' | 'challenge' | 'event' | 'fund' | 'me'

export type NavTab = {
  href: string
  label: string
  icon: TabIcon
  enabled: boolean
}

export const NAV_TABS: NavTab[] = [
  { href: '/', label: 'Trang chủ', icon: 'home', enabled: true },
  { href: '/challenges', label: 'Challenge', icon: 'challenge', enabled: true },
  { href: '/events', label: 'Event', icon: 'event', enabled: true },
  { href: '/fund', label: 'Quỹ', icon: 'fund', enabled: true },
  { href: '/me', label: 'Tôi', icon: 'me', enabled: true },
]
