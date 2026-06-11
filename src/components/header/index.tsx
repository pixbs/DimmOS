import Clock from './clock'
import Logo from './logo'

export default function Header() {
  return (
    <header className="relative z-40 h-10 flex items-center justify-between px-4 border-b-2 border-fg/10 text-sm">
      <Logo />
      <Clock />
    </header>
  )
}
