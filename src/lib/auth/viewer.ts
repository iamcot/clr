import 'server-only'
import { getCurrentMember, type CurrentMember } from '@/lib/auth/currentMember'
import { viewerKindOf, type ViewerKind } from '@/lib/auth/viewerKind'

export type Viewer = { kind: ViewerKind; member: CurrentMember | null }

// Trang công khai dùng hàm này thay cho requireActiveMember; chỉ viewer.kind === 'member' mới có dữ liệu riêng của thành viên
export async function getViewer(): Promise<Viewer> {
  const member = await getCurrentMember()
  return { kind: viewerKindOf(member), member }
}

export function activeMemberOf(viewer: Viewer): CurrentMember | null {
  return viewer.kind === 'member' ? viewer.member : null
}
