export const ADMIN_INPUT_CLASS =
  'min-h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none md:min-h-9'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-sm active:bg-brand-dark md:hover:bg-brand-dark',
  secondary: 'border border-hairline bg-white text-ink shadow-sm active:bg-surface md:hover:border-brand md:hover:text-brand-dark',
  danger: 'border border-danger/40 bg-white text-danger shadow-sm active:bg-danger/10',
}

export function adminButtonClass(variant: ButtonVariant = 'secondary'): string {
  return `inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold md:min-h-9 ${BUTTON_VARIANTS[variant]}`
}
