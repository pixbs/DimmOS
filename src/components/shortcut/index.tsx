import Link from 'next/link'

interface ShortcutProps {
  icon: string
  name: string
  href: string
  color: string
}

export function Shortcut({ icon, name, href, color }: ShortcutProps) {
  return (
    <Link
      href={href}
      className="col-span-2 flex flex-col items-center gap-2 no-underline text-white [-webkit-tap-highlight-color:transparent] justify-center"
    >
      <div
        className="h-12 w-12 rounded-md flex items-center justify-center text-[24px] leading-none transition-opacity active:opacity-70"
        style={{
          background: `color-mix(in srgb, ${color} 22%, #0d0d0d)`,
          color,
        }}
      >
        <i className={icon} />
      </div>
      <span className="text-[0.8125rem] text-center whitespace-nowrap">{name}</span>
    </Link>
  )
}
