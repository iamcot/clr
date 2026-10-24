import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FollowButton from '@/components/FollowButton'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDateVi } from '@/lib/format/dateTime'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function loadProfile(memberId: string, viewerId: string) {
  const supabase = await createSupabaseServerClient()
  const [profile, followers, following, viewerFollows] = await Promise.all([
    supabase.from('members_public').select('id, display_name, avatar_url, member_type, joined_at').eq('id', memberId).maybeSingle(),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', memberId),
    supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', memberId),
    supabase.from('follows').select('followee_id').eq('follower_id', viewerId).eq('followee_id', memberId).maybeSingle(),
  ])
  return {
    profile: profile.data,
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    viewerFollows: viewerFollows.data !== null,
  }
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireActiveMember()
  const { id } = await params
  const { profile, followerCount, followingCount, viewerFollows } = await loadProfile(id, me.id)
  if (!profile) notFound()

  return (
    <section>
      <Link href="/members" className="text-sm text-muted underline">
        ← Danh bạ
      </Link>
      <div className="mt-3 flex items-center gap-4">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={80} height={80} className="rounded-full" unoptimized />
        ) : (
          <span className="size-20 rounded-full bg-line" />
        )}
        <div>
          <h1 className="text-2xl font-black">{profile.display_name ?? 'Thành viên'}</h1>
          <p className="text-sm text-muted">
            {profile.member_type && `${MEMBER_TYPE_LABELS[profile.member_type]} · `}
            {profile.joined_at && `vào CLB ${formatDateVi(profile.joined_at)}`}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm">
        <strong>{followerCount}</strong> người theo dõi · đang theo dõi <strong>{followingCount}</strong>
      </p>
      {profile.id !== me.id && (
        <div className="mt-4">
          <FollowButton memberId={profile.id} following={viewerFollows} />
        </div>
      )}
    </section>
  )
}
