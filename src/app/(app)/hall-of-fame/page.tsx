import Link from 'next/link'
import ClubRecordsView from '@/components/ClubRecordsView'
import { HONOR_KIND_LABELS, type HonorKind } from '@/config/hallOfFame'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDateVi } from '@/lib/format/dateTime'
import { loadHonors, type HonorView } from '@/lib/hallOfFame/loadHonors'
import { loadVerifiedRecordResults } from '@/lib/hallOfFame/loadRecords'
import { buildClubRecords } from '@/lib/hallOfFame/records'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type Tab = 'records' | HonorKind

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'records', label: 'Kỷ lục' },
  { tab: 'podium', label: HONOR_KIND_LABELS.podium },
  { tab: 'challenge_champion', label: 'Challenge' },
  { tab: 'milestone', label: HONOR_KIND_LABELS.milestone },
]

type SearchParams = { tab?: string; year?: string }

function parseTab(value: string | undefined): Tab {
  return TABS.find((item) => item.tab === value)?.tab ?? 'records'
}

function yearOf(honor: HonorView): string {
  return honor.date.slice(0, 4)
}

function buildHref(tab: Tab, year: string | undefined): string {
  const query = new URLSearchParams({ tab })
  if (year) query.set('year', year)
  return `/hall-of-fame?${query.toString()}`
}

function tabClass(active: boolean): string {
  return `flex min-h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold ${
    active ? 'bg-brand text-white' : 'border border-line bg-white'
  }`
}

export default async function HallOfFamePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireActiveMember()
  const params = await searchParams
  const tab = parseTab(params.tab)
  const year = params.year

  const honors = tab === 'records' ? [] : (await loadHonors({ approvedOnly: true })).filter((honor) => honor.kind === tab)
  const years = [...new Set(honors.map(yearOf))].sort().reverse()
  const visibleHonors = year ? honors.filter((honor) => yearOf(honor) === year) : honors
  const records = tab === 'records' ? buildClubRecords(await loadVerifiedRecordResults(await createSupabaseServerClient())) : []

  return (
    <section>
      <h1 className="text-2xl font-black">Bảng vàng</h1>
      <div className="mt-3 flex gap-2">
        {TABS.map((item) => (
          <Link key={item.tab} href={buildHref(item.tab, undefined)} className={tabClass(item.tab === tab)}>
            {item.label}
          </Link>
        ))}
      </div>
      {tab === 'records' && <ClubRecordsView tables={records} />}
      {tab !== 'records' && (
        <>
          {years.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              <Link href={buildHref(tab, undefined)} className={`${tabClass(!year)} shrink-0 px-4`}>
                Tất cả
              </Link>
              {years.map((item) => (
                <Link key={item} href={buildHref(tab, item)} className={`${tabClass(year === item)} shrink-0 px-4`}>
                  {item}
                </Link>
              ))}
            </div>
          )}
          <HonorList honors={visibleHonors} />
        </>
      )}
    </section>
  )
}

function HonorList({ honors }: { honors: HonorView[] }) {
  if (honors.length === 0) return <p className="mt-4 text-muted">Chưa có danh hiệu nào.</p>
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {honors.map((honor) => (
        <li key={honor.id} className="rounded-lg bg-white p-3 shadow-sm">
          <Link href={`/members/${honor.memberId}`} className="font-bold">
            {honor.memberName}
          </Link>
          <p className="text-sm">{honor.title}</p>
          <p className="text-xs text-muted">
            {honor.detail && `${honor.detail} · `}
            {formatDateVi(`${honor.date}T00:00:00+07:00`)}
          </p>
        </li>
      ))}
    </ul>
  )
}
