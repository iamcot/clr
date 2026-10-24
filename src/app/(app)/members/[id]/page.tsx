import { notFound } from 'next/navigation'
import Avatar from '@/components/Avatar'
import BackLink from '@/components/BackLink'
import FollowButton from '@/components/FollowButton'
import HonorBadges from '@/components/HonorBadges'
import PersonalRecordsCard from '@/components/PersonalRecordsCard'
import RaceResultsList from '@/components/RaceResultsList'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import type { MemberType } from '@/lib/types/database'
import { activeMemberOf, getViewer } from '@/lib/auth/viewer'
import { formatDateVi } from '@/lib/format/dateTime'
import { loadHonors } from '@/lib/hallOfFame/loadHonors'
import { loadRaceResults } from '@/lib/races/loadRaces'
import { levelName } from '@/lib/stats/level'
import { formatKm } from '@/lib/stats/format'
import { loadPublicPersonalRecords } from '@/lib/records/loadPersonalRecords'
import { canShowOthersActivities } from '@/lib/settings/clubDisplayMode'
import { loadClubDisplayMode } from '@/lib/settings/loadClubDisplayMode'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type SharedStats = { level: number; monthDistanceM: number | null; yearDistanceM: number | null }

// Chỉ có dòng khi người đó bật chia sẻ và CLB đang để chế độ full_opt_in (view tự lọc).
// Khách và người chưa được duyệt chỉ thấy level, không thấy km
async function loadSharedStats(memberId: string, includeDistance: boolean): Promise<SharedStats | null> {
  const supabase = await createSupabaseServerClient()
  if (!includeDistance) {
    const { data } = await supabase.from('club_rankings_levels').select('level').eq('member_id', memberId).maybeSingle()
    return data?.level == null ? null : { level: data.level, monthDistanceM: null, yearDistanceM: null }
  }
  const { data } = await supabase
    .from('club_rankings')
    .select('level, month_distance_m, year_distance_m')
    .eq('member_id', memberId)
    .maybeSingle()
  if (!data) return null
  return { level: data.level ?? 1, monthDistanceM: data.month_distance_m ?? 0, yearDistanceM: data.year_distance_m ?? 0 }
}

// Người chưa được duyệt đọc view đã che tên và bỏ ảnh
async function loadProfile(memberId: string, viewerId: string | null, isMember: boolean) {
  const supabase = await createSupabaseServerClient()
  const [profile, followers, following, viewerFollows] = await Promise.all([
    supabase
      .from(isMember ? 'members_public' : 'members_masked')
      .select('id, display_name, avatar_url, member_type, joined_at')
      .eq('id', memberId)
      .maybeSingle(),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', memberId),
    supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', memberId),
    viewerId
      ? supabase.from('follows').select('followee_id').eq('follower_id', viewerId).eq('followee_id', memberId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const row = profile.data
  return {
    profile: row?.id ? { ...row, id: row.id, member_type: (row.member_type as MemberType | null) ?? null } : null,
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    viewerFollows: viewerFollows.data !== null,
  }
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer()
  const me = activeMemberOf(viewer)
  const { id } = await params
  const { profile, followerCount, followingCount, viewerFollows } = await loadProfile(id, me?.id ?? null, viewer.kind === 'member')
  if (!profile) notFound()
  const isMember = viewer.kind === 'member'
  const includeStravaPrs = isMember && canShowOthersActivities(await loadClubDisplayMode())
  const [records, races, shared, honors] = await Promise.all([
    isMember ? loadPublicPersonalRecords(profile.id, includeStravaPrs) : null,
    isMember ? loadRaceResults(profile.id) : [],
    loadSharedStats(profile.id, isMember),
    isMember ? loadHonors({ approvedOnly: true, memberId: profile.id }) : [],
  ])

  return (
    <section>
      <BackLink href="/members">Danh bạ</BackLink>
      <div className="mt-3 flex items-center gap-4">
        <Avatar url={profile.avatar_url} size={80} />
        <div>
          <h1 className="text-2xl font-black">{profile.display_name ?? 'Thành viên'}</h1>
          <p className="text-sm text-muted">
            {profile.member_type && `${MEMBER_TYPE_LABELS[profile.member_type]} · `}
            {profile.joined_at && `vào CLB ${formatDateVi(profile.joined_at)}`}
          </p>
        </div>
      </div>
      {viewer.member && (
        <p className="mt-4 text-sm">
          <strong>{followerCount}</strong> người theo dõi · đang theo dõi <strong>{followingCount}</strong>
        </p>
      )}
      {profile.id !== me?.id && (
        <div className="mt-4">
          <FollowButton
            memberId={profile.id}
            following={viewerFollows}
            viewerKind={viewer.kind}
            next={`/members/${profile.id}`}
          />
        </div>
      )}
      {shared && (
        <div className={`mt-4 grid gap-2 text-center text-sm ${isMember ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <div className="rounded-lg bg-white shadow-sm p-2">
            <p className="text-xs text-muted">Level</p>
            <p className="font-black">{shared.level} {levelName(shared.level)}</p>
          </div>
          {shared.monthDistanceM !== null && (
            <div className="rounded-lg bg-white shadow-sm p-2">
              <p className="text-xs text-muted">Km tháng này</p>
              <p className="font-black">{formatKm(shared.monthDistanceM)}</p>
            </div>
          )}
          {shared.yearDistanceM !== null && (
            <div className="rounded-lg bg-white shadow-sm p-2">
              <p className="text-xs text-muted">Km năm nay</p>
              <p className="font-black">{formatKm(shared.yearDistanceM)}</p>
            </div>
          )}
        </div>
      )}
      {isMember && records && (
        <>
          <HonorBadges honors={honors} />
          <PersonalRecordsCard records={records} editable={false} />
          <div className="mt-6">
            <h2 className="text-lg font-black">Giải đã chạy</h2>
            <RaceResultsList results={races} editable={false} />
          </div>
        </>
      )}
    </section>
  )
}
