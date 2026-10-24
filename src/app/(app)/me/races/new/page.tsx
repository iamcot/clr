import BackLink from '@/components/BackLink'
import RaceResultForm from '@/components/RaceResultForm'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadRaceNameSuggestions } from '@/lib/races/loadRaces'

export default async function NewRaceResultPage() {
  await requireActiveMember()
  const raceNameSuggestions = await loadRaceNameSuggestions()

  return (
    <section>
      <BackLink href="/me/races">Giải đã chạy</BackLink>
      <h1 className="mt-2 mb-4 text-2xl font-black">Thêm kết quả giải</h1>
      <RaceResultForm defaults={{ distance: '5k' }} raceNameSuggestions={raceNameSuggestions} />
    </section>
  )
}
