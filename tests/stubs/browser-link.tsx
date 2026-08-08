import type { AnchorHTMLAttributes, ReactNode } from 'react'

export default function BrowserLink({
  children,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}
