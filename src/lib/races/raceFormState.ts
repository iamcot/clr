export type RaceFormState = {
  errors: Partial<Record<string, string>>
  values: Record<string, string>
}

export const EMPTY_RACE_FORM_STATE: RaceFormState = { errors: {}, values: {} }
