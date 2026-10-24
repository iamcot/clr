import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { MEMBER_DIRECTORY_PAGE_SIZE, MEMBER_TYPE_LABELS } from '@/config/members'
import { getViewer } from '@/lib/auth/viewer'
import type { MemberType } from '@/lib/types/database'
import { toLikePattern } from '@/lib/members/memberFilter'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const SEARCH_MAX_LENGTH = 50

// Người chưa được duyệt đọc view đã che tên và bỏ ảnh
async function loadDirectory(search: string, isMember: boolean) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from(isMember ? 'members_public' : 'members_masked')
    .select('id, display_name, avatar_url, member_type')
    .order('display_name')
    .limit(MEMBER_DIRECTORY_PAGE_SIZE)
  if (search) query = query.ilike('display_name', toLikePattern(search))
  const { data } = await query
  return (data ?? []).flatMap((row) =>
    row.id ? [{ ...row, id: row.id, member_type: (row.member_type as MemberType | null) ?? null }] : [],
  )
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await getViewer()
  const search = ((await searchParams).q ?? '').trim().slice(0, SEARCH_MAX_LENGTH)
  const members = await loadDirectory(search, viewer.kind === 'member')

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
          </li>
        ))}
      </ul>
      {members.length === 0 && <p className="mt-4 text-muted">Không tìm thấy ai.</p>}
    </section>
  )
}
