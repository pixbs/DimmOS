export function BSODContent({ slug }: { slug?: string }) {
  return (
    <div
      className="flex-1 flex h-full rounded-2xl flex-col p-8 font-mono text-sm leading-relaxed"
      style={{ background: '#F22F57', color: 'white' }}
    >
      <p className="text-5xl mb-6 leading-none select-none">:(</p>
      <p className="uppercase tracking-wider font-semibold mb-5">
        An error has occurred.
      </p>
      <p className="uppercase tracking-wide leading-loose mb-5 opacity-90 text-xs">
        A problem has been detected with your navigation, and this window has been
        shut down to prevent damage to your portfolio experience.
      </p>
      <p className="uppercase font-bold tracking-widest text-xs mb-1">
        WINDOW_NOT_FOUND
      </p>
      {slug && (
        <p className="opacity-70 tracking-wide text-xs mb-5">/{slug}</p>
      )}
      <p className="uppercase tracking-wide leading-loose opacity-90 text-xs">
        If this is the first time you&apos;ve seen this error, navigate home.
        If problems continue, press ctrl&nbsp;+&nbsp;z on the files you&apos;re
        working on until it resolves itself.
      </p>
    </div>
  )
}
