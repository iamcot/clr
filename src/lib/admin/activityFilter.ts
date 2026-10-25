import { ACTIVITY_SPORT_GROUPS, ACTIVITY_SPORT_TYPES, type ActivitySportGroup } from '@/config/admin'
import { parsePage } from '@/lib/admin/pagination'

export type ActivityTab = 'counted' | 'excluded'

export type ActivityFilter = {
  tab: ActivityTab
  page: number
  from: string | null
  to: string | null
  sports: ActivitySportGroup[]
  memberIds: string[]
}

export type RawActivityParams = Record<string, string | string[] | undefined>

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const UUID_PATTERN = /^[0-9a-f-]{36}$/i

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function pickDate(value: string | string[] | undefined): string | null {
  const text = asList(value)[0]
  return text && DATE_PATTERN.test(text) ? text : null
}

export function parseActivityFilter(raw: RawActivityParams): ActivityFilter {
  const groups: string[] = ACTIVITY_SPORT_GROUPS
  return {
    tab: asList(raw.show)[0] === 'excluded' ? 'excluded' : 'counted',
    page: parsePage(asList(raw.page)[0]),
    from: pickDate(raw.from),
    to: pickDate(raw.to),
    sports: asList(raw.sport).filter((value): value is ActivitySportGroup => groups.includes(value)),
    memberIds: asList(raw.member).filter((value) => UUID_PATTERN.test(value)),
  }
}

// Biểu thức .or() của PostgREST: các loại thuộc nhóm đã chọn, nhóm "other" là mọi loại ngoài ba nhóm
export function buildSportClause(sports: ActivitySportGroup[]): string | null {
  if (sports.length === 0) return null
  const known = Object.values(ACTIVITY_SPORT_TYPES).flat()
  const clauses = sports.map((group) =>
    group === 'other'
      ? `sport_type.not.in.(${known.join(',')})`
      : `sport_type.in.(${ACTIVITY_SPORT_TYPES[group].join(',')})`,
  )
  return clauses.join(',')
}

// Ngày theo giờ Việt Nam: đầu ngày "từ", cuối ngày "đến"
export function dayStartIso(date: string): string {
  return new Date(`${date}T00:00:00+07:00`).toISOString()
}

export function dayEndIso(date: string): string {
  return new Date(`${date}T23:59:59.999+07:00`).toISOString()
}
