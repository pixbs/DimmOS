'use client'

import type { StatsBlock } from '@/payload-types'
import { CountUp } from '@/components/animation'

/**
 * Stats section: up to three large figures that count up from 0 when scrolled
 * into view, each with a label. The numeric value and its suffix are visually
 * distinct (the suffix is smaller and brand-coloured).
 */
export function StatsView({ block }: { block: StatsBlock }) {
  const stats = block.stats ?? []
  if (stats.length === 0) return null
  return (
    <section data-block-type="stats" className="@container">
      <div className="grid grid-cols-1 gap-8 @lg:grid-cols-3">
        {stats.map((stat, i) => (
          <div key={stat.id ?? i} className="flex flex-col gap-2">
            <CountUp
              value={stat.value}
              suffix={stat.suffix ?? ''}
              className="text-fg"
              numberClassName="text-5xl font-bold leading-none @2xl:text-6xl"
              affixClassName="text-3xl font-bold text-brand @2xl:text-4xl"
            />
            <span className="text-sm text-fg/60">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
