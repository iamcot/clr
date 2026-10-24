import type { Database as GeneratedDatabase } from '@/lib/types/database.generated'

export type { Json } from '@/lib/types/database.generated'

// `supabase gen types` sinh cột text có check constraint thành `string`; file này thu hẹp lại theo constraint
// trong migration. Thêm giá trị mới vào constraint thì sửa union tương ứng ở đây.
export type MemberRole = 'guest' | 'member' | 'bcn' | 'treasurer'
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'rejected'
export type MemberType = 'official' | 'free'
export type Gender = 'M' | 'F' | 'X'
export type ActivityVisibility = 'everyone' | 'followers_only' | 'only_me'
export type BackfillJobStatus = 'pending' | 'done' | 'failed'
export type RateWindowName = 'read_15m' | 'read_day' | 'all_15m' | 'all_day'

type MemberColumns = { role: MemberRole; status: MemberStatus; member_type: MemberType; gender: Gender }
type MemberPublicColumns = Pick<MemberColumns, 'member_type' | 'gender'>
// PostgREST trả kiểu point dạng chuỗi '(x,y)'
type ActivityColumns = { visibility: ActivityVisibility; start_latlng: string | null }

type NarrowType<Generated, Narrowed> = null extends Generated ? Narrowed | null : Narrowed

type NarrowColumns<Columns, Narrowed> = {
  [Column in keyof Columns]: Column extends keyof Narrowed ? NarrowType<Columns[Column], Narrowed[Column]> : Columns[Column]
}

type NarrowRelation<Relation, Narrowed> = {
  [Part in keyof Relation]: Part extends 'Row' | 'Insert' | 'Update' ? NarrowColumns<Relation[Part], Narrowed> : Relation[Part]
}

type GeneratedPublic = GeneratedDatabase['public']
type GeneratedTables = GeneratedPublic['Tables']
type GeneratedViews = GeneratedPublic['Views']
type GeneratedFunctions = GeneratedPublic['Functions']

type PublicTables = Omit<GeneratedTables, 'members' | 'activities' | 'backfill_jobs' | 'strava_rate_state'> & {
  members: NarrowRelation<GeneratedTables['members'], MemberColumns>
  activities: NarrowRelation<GeneratedTables['activities'], ActivityColumns>
  backfill_jobs: NarrowRelation<GeneratedTables['backfill_jobs'], { status: BackfillJobStatus }>
  strava_rate_state: NarrowRelation<GeneratedTables['strava_rate_state'], { window_name: RateWindowName }>
}

type PublicViews = Omit<GeneratedViews, 'members_public'> & {
  members_public: NarrowRelation<GeneratedViews['members_public'], MemberPublicColumns>
}

// Tham số hàm Postgres luôn nhận null, nhưng gen types sinh `p_reason: string`; bỏ cờ thì truyền null
type PublicFunctions = Omit<GeneratedFunctions, 'set_activity_flag'> & {
  set_activity_flag: {
    Args: NarrowColumns<GeneratedFunctions['set_activity_flag']['Args'], { p_reason: string | null }>
    Returns: GeneratedFunctions['set_activity_flag']['Returns']
  }
}

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedPublic, 'Tables' | 'Views' | 'Functions'> & {
    Tables: PublicTables
    Views: PublicViews
    Functions: PublicFunctions
  }
}
