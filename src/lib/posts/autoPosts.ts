import 'server-only'
import { AUTO_POST_SETTING_KEY, AUTO_POST_TOP_PER_CATEGORY, LEVEL_DIGEST_DAYS, type PostKind } from '@/config/posts'
import type { GoalType } from '@/config/challenges'
import { LEVEL_RULES } from '@/config/levels'
import { formatProgressValue } from '@/lib/challenges/describe'
import {
  buildChallengeResultPost,
  buildLevelDigestPost,
  pickLevelUps,
  type AutoPostContent,
  type ResultCategory,
} from '@/lib/posts/autoPostContent'
import { canShowOthersActivities, parseClubDisplayMode } from '@/lib/settings/clubDisplayMode'
import { levelName } from '@/lib/stats/level'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

const VN_OFFSET_MS = 7 * 3600 * 1000
const ENTRY_LIMIT = 5000

function throwOnError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`)
}

async function readSetting(db: ServiceClient, key: string): Promise<unknown> {
  const { data, error } = await db.from('settings').select('value').eq('key', key).maybeSingle()
  throwOnError(error, 'Không đọc được cài đặt')
  return data?.value
}

// Bài tự sinh mặc định tự đăng; tắt ở settings thì tạo bản nháp để BCN sửa rồi đăng
async function insertSystemPost(
  db: ServiceClient,
  sourceKey: string,
  kind: PostKind,
  content: AutoPostContent,
  now: Date,
): Promise<boolean> {
  const autoPublish = (await readSetting(db, AUTO_POST_SETTING_KEY)) !== false
  const { data, error } = await db
    .from('posts')
    .upsert(
      {
        source_key: sourceKey,
        kind,
        title: content.title,
        body_md: content.bodyMd,
        published_at: autoPublish ? now.toISOString() : null,
      },
      { onConflict: 'source_key', ignoreDuplicates: true },
    )
    .select('id')
  throwOnError(error, 'Không tạo được bài tự động')
  return (data?.length ?? 0) > 0
}

async function canNameMembers(db: ServiceClient): Promise<boolean> {
  return canShowOthersActivities(parseClubDisplayMode(await readSetting(db, 'club_display_mode')))
}

type EntryRow = {
  member_id: string
  category_id: string
  value: number
  completed: boolean
  rank: number | null
  excluded: boolean
  members: { display_name: string | null; share_stats_with_club: boolean } | null
}

function summarizeCategory(
  category: { id: string; name: string },
  entries: EntryRow[],
  goalType: GoalType,
  nameMembers: boolean,
): ResultCategory {
  const inCategory = entries.filter((entry) => entry.category_id === category.id && !entry.excluded)
  const top = nameMembers
    ? inCategory
        .filter((entry) => entry.rank !== null && entry.rank <= AUTO_POST_TOP_PER_CATEGORY)
        .filter((entry) => entry.members?.share_stats_with_club)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((entry) => ({
          rank: entry.rank ?? 0,
          name: entry.members?.display_name ?? 'Thành viên',
          valueText: formatProgressValue(goalType, Number(entry.value)),
        }))
    : []
  return {
    name: category.name,
    participantCount: inCategory.length,
    completedCount: inCategory.filter((entry) => entry.completed).length,
    top,
  }
}

export async function publishChallengeResultPost(db: ServiceClient, challengeId: string, now: Date): Promise<boolean> {
  const [challenge, categories, entries, nameMembers] = await Promise.all([
    db.from('challenges').select('title, goal_type').eq('id', challengeId).maybeSingle(),
    db.from('challenge_categories').select('id, name').eq('challenge_id', challengeId).order('sort'),
    db
      .from('challenge_entries')
      .select('member_id, category_id, value, completed, rank, excluded, members(display_name, share_stats_with_club)')
      .eq('challenge_id', challengeId)
      .range(0, ENTRY_LIMIT - 1),
    canNameMembers(db),
  ])
  throwOnError(challenge.error, 'Không đọc được challenge')
  throwOnError(categories.error, 'Không đọc được hạng mục')
  throwOnError(entries.error, 'Không đọc được kết quả')
  if (!challenge.data) return false

  const goalType = challenge.data.goal_type as GoalType
  const summaries = (categories.data ?? []).map((category) =>
    summarizeCategory(category, (entries.data ?? []) as EntryRow[], goalType, nameMembers),
  )
  const content = buildChallengeResultPost(challenge.data.title, challengeId, summaries)
  return insertSystemPost(db, `challenge:${challengeId}`, 'result', content, now)
}

function vietnamDate(now: Date): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)
}

// Một bài mỗi tuần, chỉ gồm người đã bật chia sẻ; CLB chưa cho hiển thị số liệu giữa các thành viên thì bỏ qua
export async function publishLevelDigestPost(db: ServiceClient, now: Date): Promise<boolean> {
  if (!(await canNameMembers(db))) return false
  const since = new Date(now.getTime() - LEVEL_DIGEST_DAYS * 24 * 3600 * 1000).toISOString()
  const { data, error } = await db
    .from('level_changes')
    .select('member_id, old_level, new_level, changed_at, members(display_name, share_stats_with_club, status)')
    .gte('changed_at', since)
  throwOnError(error, 'Không đọc được thay đổi level')

  const rows = (data ?? []).filter((row) => row.members?.share_stats_with_club && row.members.status === 'active')
  const levelUps = pickLevelUps(
    rows.map((row) => ({
      memberId: row.member_id,
      oldLevel: row.old_level,
      newLevel: row.new_level,
      changedAt: row.changed_at,
    })),
  )
  if (levelUps.length === 0) return false

  const nameById = new Map(rows.map((row) => [row.member_id, row.members?.display_name ?? 'Thành viên']))
  const content = buildLevelDigestPost(
    levelUps.map((item) => ({
      name: nameById.get(item.memberId) ?? 'Thành viên',
      level: item.level,
      levelName: levelName(item.level, LEVEL_RULES),
    })),
  )
  return insertSystemPost(db, `level-digest:${vietnamDate(now)}`, 'system', content, now)
}
