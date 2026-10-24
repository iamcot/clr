import Link from 'next/link'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/FollowButton'
import { MEMBER_DIRECTORY_PAGE_SIZE, MEMBER_TYPE_LABELS } from '@/config/members'
import { activeMemberOf, getViewer } from '@/lib/auth/viewer'
import { toLikePattern } from '@/lib/members/memberFilter'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const SEARCH_MAX_LENGTH = 50

async function loadDirectory(search: string) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('members_public')
    .select('id, display_name, avatar_url, member_type')
    .order('display_name')
    .limit(MEMBER_DIRECTORY_PAGE_SIZE)
  if (search) query = query.ilike('display_name', toLikePattern(search))
  const { data } = await query
  return data ?? []
}

async function loadFollowingIds(memberId: string | undefined): Promise<Set<string>> {
  if (!memberId) return new Set()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', memberId)
  return new Set((data ?? []).map((row) => row.followee_id))
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await getViewer()
  const me = activeMemberOf(viewer)
  const search = ((await searchParams).q ?? '').trim().slice(0, SEARCH_MAX_LENGTH)
  const [members, followingIds] = await Promise.all([loadDirectory(search), loadFollowingIds(me?.id)])

  return (
    <section>
      <h1 className="text-2xl font-black">Thành viên</h1>
      <form className="mt-3 flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Tìm theo tên"
          className="min-h-11 w-full rounded-lg border border-line bg-white px-3"
        />
        <button type="submit" className="min-h-11 rounded-lg border border-line bg-white px-4 font-bold">
          Tìm
        </button>
      </form>
      <ul className="mt-4 flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 rounded-lg bg-white shadow-sm p-3">
            <Link href={`/members/${member.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar url={member.avatar_url} size={40} />
              <span className="min-w-0">
                <span className="block truncate font-bold">{member.display_name ?? 'Thành viên'}</span>
                {member.member_type && <span className="text-sm text-muted">{MEMBER_TYPE_LABELS[member.member_type]}</span>}
              </span>
            </Link>
            {member.id !== me?.id && (
              <FollowButton
                memberId={member.id}
                following={followingIds.has(member.id)}
                viewerKind={viewer.kind}
                next="/members"
              />
            )}
          </li>
        ))}
      </ul>
      {members.length === 0 && <p className="mt-4 text-muted">Không tìm thấy ai.</p>}
    </section>
  )
}
