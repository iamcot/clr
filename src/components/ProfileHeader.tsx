import Image from 'next/image'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import type { MemberType } from '@/lib/types/database'

type ProfileHeaderProps = {
  displayName: string | null
  avatarUrl: string | null
  memberType: MemberType | null
  memberCode?: string | null
  followerCount: number
}

export default function ProfileHeader({
  displayName,
  avatarUrl,
  memberType,
  memberCode,
  followerCount,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-deep p-4 text-white">
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" width={64} height={64} className="rounded-full" unoptimized />
      ) : (
        <span className="size-16 rounded-full bg-white/20" />
      )}
      <div>
        <h1 className="text-xl font-black">{displayName ?? 'Thành viên'}</h1>
        <p className="text-sm text-white/80">
          {memberType && MEMBER_TYPE_LABELS[memberType]}
          {memberCode && ` · ${memberCode}`}
        </p>
        <p className="text-sm text-white/80">
          <strong className="text-white">{followerCount}</strong> người theo dõi · Level: chưa có
        </p>
      </div>
    </div>
  )
}
