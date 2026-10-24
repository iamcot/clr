import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import {
  ADMIN_MEMBER_PAGE_SIZE,
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
  MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
} from '@/config/members'
import { GENDER_OPTIONS } from '@/config/profile'
import { reviewMembers } from '@/lib/members/adminActions'
import { parseMemberFilter, toLikePattern, type MemberFilter } from '@/lib/members/memberFilter'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const LIST_COLUMNS = 'id, display_name, member_code, member_type, gender, avatar_url, created_at' as const

async function loadMembers(filter: MemberFilter) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('members')
    .select(LIST_COLUMNS)
    .eq('status', filter.status)
    .order('created_at', { ascending: false })
    .limit(ADMIN_MEMBER_PAGE_SIZE)
  if (filter.search) query = query.ilike('display_name', toLikePattern(filter.search))
  if (filter.type) query = query.eq('member_type', filter.type)
  if (filter.gender) query = query.eq('gender', filter.gender)
  const { data } = await query
  return data ?? []
}

type MemberRow = Awaited<ReturnType<typeof loadMembers>>[number]

function StatusTabs({ filter }: { filter: MemberFilter }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {MEMBER_STATUSES.map((status) => (
        <Link
          key={status}
          href={`/admin/members?status=${status}`}
          aria-current={status === filter.status ? 'page' : undefined}
          className={`flex min-h-11 items-center rounded-lg px-4 font-bold ${
            status === filter.status ? 'bg-brand text-white' : 'bg-white text-ink'
          }`}
        >
          {MEMBER_STATUS_LABELS[status]}
        </Link>
      ))}
    </nav>
  )
}

function FilterForm({ filter }: { filter: MemberFilter }) {
  return (
    <form className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <input type="hidden" name="status" value={filter.status} />
      <input name="q" defaultValue={filter.search} placeholder="Tìm theo tên" className={`${INPUT_CLASS} col-span-2`} />
      <select name="type" defaultValue={filter.type ?? ''} className={INPUT_CLASS}>
        <option value="">Mọi loại</option>
        {MEMBER_TYPES.map((type) => (
          <option key={type} value={type}>
            {MEMBER_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <select name="gender" defaultValue={filter.gender ?? ''} className={INPUT_CLASS}>
        <option value="">Mọi giới tính</option>
        {GENDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="min-h-11 rounded-lg border border-line bg-white px-4 font-bold">
        Lọc
      </button>
    </form>
  )
}

function MemberLine({ member, selectable }: { member: MemberRow; selectable: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-white p-3">
      {selectable && <input type="checkbox" name="member_id" value={member.id} className="size-5 shrink-0" />}
      <Link href={`/admin/members/${member.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-bold">{member.display_name ?? 'Chưa có tên'}</span>
        <span className="text-sm text-muted">
          {member.member_code}
          {member.member_type && ` · ${MEMBER_TYPE_LABELS[member.member_type]}`}
        </span>
      </Link>
    </li>
  )
}

function ReviewControls() {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg bg-white p-3">
      <p className="text-sm text-muted">Tick người cần xử lý, rồi chọn loại và bấm Duyệt, hoặc nhập lý do và bấm Từ chối.</p>
      <select name="member_type" defaultValue="" className={INPUT_CLASS}>
        <option value="">Chọn loại thành viên khi duyệt</option>
        {MEMBER_TYPES.map((type) => (
          <option key={type} value={type}>
            {MEMBER_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        name="decision"
        value="approve"
        className="min-h-11 rounded-lg bg-brand px-4 font-bold text-white"
      >
        Duyệt
      </button>
      <input name="reason" placeholder="Lý do từ chối" maxLength={200} className={INPUT_CLASS} />
      <button
        type="submit"
        name="decision"
        value="reject"
        className="min-h-11 rounded-lg border border-danger px-4 font-bold text-danger"
      >
        Từ chối
      </button>
    </div>
  )
}

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const filter = parseMemberFilter(await searchParams)
  const members = await loadMembers(filter)
  const isPendingTab = filter.status === 'pending'

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Thành viên</h1>
        <form action="/admin/members/export">
          <button type="submit" className="min-h-11 font-bold text-brand-dark underline">
            Xuất CSV
          </button>
        </form>
      </div>
      <div className="mt-3">
        <StatusTabs filter={filter} />
        <FilterForm filter={filter} />
      </div>
      <ActionForm action={reviewMembers}>
        <ul className="mt-4 flex flex-col gap-2">
          {members.map((member) => (
            <MemberLine key={member.id} member={member} selectable={isPendingTab} />
          ))}
        </ul>
        {members.length === 0 && <p className="mt-4 text-muted">Không có thành viên nào.</p>}
        {isPendingTab && members.length > 0 && <ReviewControls />}
      </ActionForm>
    </section>
  )
}
