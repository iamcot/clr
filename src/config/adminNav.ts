export type AdminNavItem = {
  href: string
  label: string
  description: string
  enabled: boolean
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Tổng quan', description: 'Số liệu nhanh của CLB', enabled: true },
  { href: '/admin/members', label: 'Thành viên', description: 'Duyệt và quản lý thành viên', enabled: true },
  {
    href: '/admin/activities',
    label: 'Hoạt động',
    description: 'Xem và đánh dấu hoạt động không hợp lệ',
    enabled: true,
  },
  { href: '/admin/races', label: 'Kết quả giải', description: 'Xác minh thành tích các giải', enabled: true },
  { href: '/admin/honors', label: 'Bảng vàng', description: 'Duyệt danh hiệu và thêm danh hiệu đặc biệt', enabled: true },
  { href: '/admin/stats', label: 'Thống kê & level', description: 'Tính lại thống kê và level', enabled: true },
  { href: '/admin/sync', label: 'Đồng bộ', description: 'Hạn mức Strava, hàng đợi, event lỗi', enabled: true },
  { href: '/admin/challenges', label: 'Challenge', description: 'Tạo và theo dõi challenge', enabled: true },
  { href: '/admin/penalties', label: 'Thưởng phạt', description: 'Thưởng và phạt thành viên', enabled: true },
  { href: '/admin/posts', label: 'Bài viết', description: 'Đăng thông báo và theo dõi xác nhận', enabled: true },
  { href: '/admin/draws', label: 'Quay số', description: 'Quay số trúng thưởng trực tiếp', enabled: true },
  { href: '/admin/events', label: 'Event', description: 'Quản lý event và album', enabled: true },
  { href: '/admin/fund', label: 'Quỹ', description: 'Sổ quỹ, đối soát chuyển khoản, thu chi', enabled: true },
]
