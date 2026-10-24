import Link from 'next/link'
import { notFound } from 'next/navigation'
import RaceResultForm from '@/components/RaceResultForm'
import { PR_DISTANCES } from '@/config/prDistances'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadRaceNameSuggestions, loadRaceResult, type RaceResultView } from '@/lib/races/loadRaces'
import { CUSTOM_DISTANCE_VALUE } from '@/lib/races/raceInput'
import { formatDuration } from '@/lib/stats/format'

function toFormDefaults(result: RaceResultView): Record<string, string> {
  const preset = PR_DISTANCES.find((distance) => distance.label === result.distanceLabel)
  return {
    id: result.id,
    race_name: result.raceName,
    race_date: result.raceDate,
    city: result.city ?? '',
    organizer: result.organizer ?? '',
    url: result.url ?? '',
    distance: preset?.name ?? CUSTOM_DISTANCE_VALUE,
    distance_label: result.distanceLabel,
    distance_km: String(result.distanceMeters / 1000),
    chip_time: formatDuration(result.chipTimeSeconds),
    gun_time: result.gunTimeSeconds ? formatDuration(result.gunTimeSeconds) : '',
    rank_overall: result.rankOverall?.toString() ?? '',
    rank_age_group: result.rankAgeGroup?.toString() ?? '',
    bib: result.bib ?? '',
    certificate_url: result.certificateUrl ?? '',
    activity_id: result.activityId?.toString() ?? '',
  }
}

export default async function EditRaceResultPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireActiveMember()
  const { id } = await params
  const [result, raceNameSuggestions] = await Promise.all([loadRaceResult(member.id, id), loadRaceNameSuggestions()])
  if (!result) notFound()

  return (
    <section>
      <Link href="/me/races" className="text-sm text-muted">
        ← Giải đã chạy
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-black">Sửa kết quả giải</h1>
      <RaceResultForm defaults={toFormDefaults(result)} raceNameSuggestions={raceNameSuggestions} />
    </section>
  )
}
