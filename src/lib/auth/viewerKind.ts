export type ViewerKind = 'guest' | 'pending' | 'member'

// Khách chưa đăng nhập, người đã đăng nhập nhưng chưa được duyệt (hoặc đã ngưng), thành viên đã duyệt
export function viewerKindOf(member: { status: string } | null): ViewerKind {
  if (!member) return 'guest'
  return member.status === 'active' ? 'member' : 'pending'
}
