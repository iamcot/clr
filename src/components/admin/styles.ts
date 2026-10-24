export const ADMIN_INPUT_CLASS =
  'min-h-11 w-full rounded-lg border border-line bg-white px-3 focus:border-brand focus:outline-none'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white active:bg-brand-dark md:hover:bg-brand-dark',
  secondary: 'border border-line bg-white text-ink active:bg-surface md:hover:bg-surface',
  danger: 'border border-danger bg-white text-danger active:bg-danger/10',
}

export function adminButtonClass(variant: ButtonVariant = 'secondary'): string {
  return `inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-bold ${BUTTON_VARIANTS[variant]}`
}
