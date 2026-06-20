'use client'

import type { StatsBlock } from '@/payload-types'
import { AnimatedDivider, CountUp } from '@/components/animation'

/**
 * Stats section: up to three large figures that count up from 0 when scrolled
 * into view, each with a label. Each figure is authored as a single string
 * (e.g. `"30Mil"`, `"$30,000"`, `"21%"`); {@link CountUp} animates the number
 * while keeping any surrounding text static.
 */
export function StatsView({ block }: { block: StatsBlock }) {
  const stats = block.stats ?? []
  if (stats.length === 0) return null
  return (
    <section data-block-type="stats" className="@container pb-10">
      <AnimatedDivider className="mb-10"/>
      <div className="grid grid-cols-2 gap-8 @lg:grid-cols-3">
        {stats.map((stat, i) => (
          <div key={stat.id ?? i} className="relative flex flex-col gap-2 @2xl:px-6">
            {i > 0 && (
              <AnimatedDivider
                orientation="vertical"
                className="absolute inset-y-0 left-0 hidden @2xl:block"
              />
            )}
            <CountUp
              className="text-fg"
              numberClassName="text-5xl @2xl:text-6xl"
              affixClassName="text-5xl @2xl:text-6xl"
            >
              {stat.value}
            </CountUp>
            <span className="text-sm text-fg/60">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
