export type RecordDistance = {
  key: string
  label: string
  distanceMeters: number
}

// Cự ly dài nhất xếp trước
export const RECORD_DISTANCES: readonly RecordDistance[] = [
  { key: 'FM', label: 'Marathon', distanceMeters: 42195 },
  { key: 'HM', label: 'Half Marathon', distanceMeters: 21097 },
  { key: '10K', label: '10K', distanceMeters: 10000 },
  { key: '5K', label: '5K', distanceMeters: 5000 },
]

// Quãng đường của giải lệch tối đa bao nhiêu so với cự ly chuẩn thì vẫn tính cùng nhóm kỷ lục
export const RECORD_DISTANCE_TOLERANCE = 0.03

export const RECORD_GENDERS = [
  { key: 'M', label: 'Nam' },
  { key: 'F', label: 'Nữ' },
] as const

export type AgeGroup = {
  key: string
  label: string
  minAge: number
  maxAge: number
}

// Tuổi tính theo năm của giải trừ năm sinh; khoảng đóng hai đầu
export const AGE_GROUPS: readonly AgeGroup[] = [
  { key: 'u30', label: 'Dưới 30', minAge: 0, maxAge: 29 },
  { key: '30s', label: '30-39', minAge: 30, maxAge: 39 },
  { key: '40s', label: '40-49', minAge: 40, maxAge: 49 },
  { key: '50p', label: 'Trên 50', minAge: 50, maxAge: Infinity },
]

export const RECORD_TOP_N = 10

// Mốc tổng km tích luỹ trong CLB
export const MILESTONES_KM = [1000, 2000, 5000] as const

// Từ cự ly này (mét) trở lên là marathon đầu tiên
export const FIRST_MARATHON_MIN_METERS = 42000

export const HONOR_KINDS = ['podium', 'challenge_champion', 'milestone', 'special'] as const
export type HonorKind = (typeof HONOR_KINDS)[number]

export const HONOR_KIND_LABELS: Record<HonorKind, string> = {
  podium: 'Podium',
  challenge_champion: 'Vô địch challenge',
  milestone: 'Cột mốc',
  special: 'Đặc biệt',
}

export const RECORD_RESULTS_LIMIT = 2000
export const HONORS_LIMIT = 500

export const HONOR_KIND_ICONS: Record<HonorKind, string> = {
  podium: '🥇',
  challenge_champion: '🏆',
  milestone: '⭐',
  special: '🎖️',
}
