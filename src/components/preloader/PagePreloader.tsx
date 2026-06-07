'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePreloader } from './preloader-context'

export function PagePreloader() {
  const { percentage, isComplete } = usePreloader()

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          data-testid="preloader"
          className="fixed inset-0 flex items-center justify-center bg-bg"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
        >
          <span
            data-testid="preloader-percentage"
            className="text-6xl font-bold tabular-nums text-fg/60 select-none"
          >
            {percentage}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
