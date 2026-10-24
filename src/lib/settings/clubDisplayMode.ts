export const CLUB_DISPLAY_MODES = ['full_opt_in', 'percent_only', 'status_only', 'self_only'] as const

export type ClubDisplayMode = (typeof CLUB_DISPLAY_MODES)[number]

const DEFAULT_MODE: ClubDisplayMode = 'self_only'

export function parseClubDisplayMode(value: unknown): ClubDisplayMode {
  return CLUB_DISPLAY_MODES.find((mode) => mode === value) ?? DEFAULT_MODE
}

export function canShowOthersActivities(mode: ClubDisplayMode): boolean {
  return mode === 'full_opt_in'
}
