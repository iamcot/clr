import Link from 'next/link'
import BackLink from '@/components/BackLink'
import RaceResultsList from '@/components/RaceResultsList'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { addActivitySuggestions, loadRaceResults } from '@/lib/races/loadRaces'

export default async function MyRacesPage() {
  const member = await requireActiveMember()
  const results = await addActivitySuggestions(member.id, await loadRaceResults(member.id))

  return (
    <section>
      <BackLink href="/me">Tôi</BackLink>
      <h1 className="mt-2 text-2xl font-black">Giải đã chạy</h1>
      <Link
        href="/me/races/new"
        className="mt-3 flex min-h-12 items-center justify-center rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
      >
        Thêm kết quả giải
      </Link>
      <RaceResultsList results={results} editable />
    </section>
  )
}
