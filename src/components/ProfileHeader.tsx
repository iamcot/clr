import Avatar from '@/components/Avatar'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import { levelName } from '@/lib/stats/level'
import type { MemberType } from '@/lib/types/database'

type ProfileHeaderProps = {
  displayName: string | null
  avatarUrl: string | null
  memberType: MemberType | null
  memberCode?: string | null
  followerCount: number
  level?: number
}

export default function ProfileHeader({
  displayName,
  avatarUrl,
  memberType,
  memberCode,
  followerCount,
  level,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-deep p-4 text-white">
      <Avatar url={avatarUrl} size={64} />
      <div>
        <h1 className="text-xl font-black">{displayName ?? 'Thành viên'}</h1>
        <p className="text-sm text-white/80">
          {memberType && MEMBER_TYPE_LABELS[memberType]}
          {memberCode && ` · ${memberCode}`}
        </p>
        <p className="text-sm text-white/80">
          <strong className="text-white">{followerCount}</strong> người theo dõi{level !== undefined && ` · Level ${level} ${levelName(level)}`}
        </p>
      </div>
    </div>
  )
}
