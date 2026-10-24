export const ADMIN_INPUT_CLASS =
  'min-h-10 w-full rounded-md border border-line bg-white px-2.5 text-sm focus:border-brand focus:outline-none md:min-h-8'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white active:bg-brand-dark md:hover:bg-brand-dark',
  secondary: 'border border-line bg-white text-ink active:bg-surface md:hover:bg-surface',
  danger: 'border border-danger bg-white text-danger active:bg-danger/10',
}

export function adminButtonClass(variant: ButtonVariant = 'secondary'): string {
  return `inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-bold md:min-h-8 ${BUTTON_VARIANTS[variant]}`
}
