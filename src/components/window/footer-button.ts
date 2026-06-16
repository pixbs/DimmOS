// Shared styling for window footer action buttons so the cookie banner,
// cookie preferences, CMS window buttons, and the form Send button all match.
// Radius is hardcoded to 16px (rounded-2xl) per design.
export type FooterButtonVariant = 'primary' | 'secondary'

const BASE =
  'py-4 rounded-2xl font-semibold text-sm text-center cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-default'

const VARIANT: Record<FooterButtonVariant, string> = {
  primary: 'bg-brand text-white',
  secondary: 'bg-bg text-fg',
}

export function footerButtonClass(variant: FooterButtonVariant = 'primary', extra = ''): string {
  return `${BASE} ${VARIANT[variant]} ${extra}`.trim()
}
