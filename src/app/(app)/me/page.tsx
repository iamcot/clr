import Link from 'next/link'
import PersonalRecordsCard from '@/components/PersonalRecordsCard'
import ProfileHeader from '@/components/ProfileHeader'
import QuickStats from '@/components/QuickStats'
import RaceResultsList from '@/components/RaceResultsList'
import RecentActivities from '@/components/RecentActivities'
import { RECENT_RACES_ON_PROFILE } from '@/config/prDistances'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadOwnMonthAndYear } from '@/lib/stats/loadStatsPeriods'
import { countFollowers } from '@/lib/members/followerCount'
import { addActivitySuggestions, loadRaceResults } from '@/lib/races/loadRaces'
import { loadOwnPersonalRecords } from '@/lib/records/loadPersonalRecords'
import { loadOwnRecentActivities } from '@/lib/strava/recentActivities'
import { getBackfillStatusText } from '@/lib/strava/syncStatus'

export default async function MePage() {
  const member = await requireActiveMember()
  const [backfillStatus, activities, summary, records, races, followerCount] = await Promise.all([
    getBackfillStatusText(member.id),
    loadOwnRecentActivities(member.id),
    loadOwnMonthAndYear(member.id, new Date()),
    loadOwnPersonalRecords(member.id),
    loadRaceResults(member.id, RECENT_RACES_ON_PROFILE),
    countFollowers(member.id),
  ])
  const racesWithSuggestions = await addActivitySuggestions(member.id, races)

  return (
    <section>
      <ProfileHeader
        displayName={member.display_name}
        avatarUrl={member.avatar_url}
        memberType={member.member_type}
        memberCode={member.member_code}
        followerCount={followerCount}
        level={member.level}
      />
      {backfillStatus && <p className="mt-4 rounded-lg bg-white shadow-sm p-3 text-sm text-muted">{backfillStatus}</p>}
      <QuickStats month={summary.month} year={summary.year} />
      <Link href="/me/stats" className="mt-2 flex min-h-11 items-center font-bold text-brand-dark underline">
        Thống kê chi tiết
      </Link>
      <PersonalRecordsCard records={records} editable />
      <div className="mt-6">
        <h2 className="text-lg font-black">Giải đã chạy</h2>
        <RaceResultsList results={racesWithSuggestions} editable />
        <Link href="/me/races" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Xem tất cả và thêm giải
        </Link>
      </div>
      <RecentActivities activities={activities} />
      <Link href="/me/settings" className="mt-6 flex min-h-11 items-center font-bold text-brand-dark underline">
        Cài đặt hồ sơ
      </Link>
      {member.role === 'bcn' && (
        <Link href="/admin" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Trang quản trị BCN
        </Link>
      )}
      <form action="/api/auth/logout" method="post" className="mt-2">
        <button type="submit" className="min-h-11 rounded-lg border border-line px-4 font-bold">
          Đăng xuất
        </button>
      </form>
    </section>
  )
}
