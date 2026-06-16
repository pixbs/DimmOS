'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { PixelatedImage } from './pixelated-image'
import { useScrollRoot } from './scroll-root-context'

/** One image layer of a {@link ParallaxImagePair}. */
export interface ParallaxLayer {
  src: string
  alt: string
  width: number
  height: number
}

/** Props for {@link ParallaxImagePair}. */
export interface ParallaxImagePairProps {
  /** The rear layer (moves least). */
  background: ParallaxLayer
  /** The front layer (moves most); omit for a single-image parallax. */
  foreground?: ParallaxLayer | null
  /** Classes for the 16:9 frame (sizing / rounding). */
  className?: string
  /** Maximum layer travel in pixels across the scroll range. Defaults to `40`. */
  strength?: number
}

/**
 * A 16:9 image frame with a two-layer parallax: a background and an optional
 * foreground that drift at different rates as the frame scrolls through the
 * window's scroll container. Each layer is a {@link PixelatedImage}, so both
 * also play the de-pixelation reveal.
 *
 * Layers are oversized slightly so the parallax travel never exposes an edge.
 * Falls back to viewport scroll when there is no surrounding scroll container.
 */
export function ParallaxImagePair({
  background,
  foreground,
  className,
  strength = 40,
}: ParallaxImagePairProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const scrollRoot = useScrollRoot()
  const { scrollYProgress } = useScroll({
    target: frameRef,
    container: scrollRoot,
    offset: ['start end', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], [-strength * 0.4, strength * 0.4])
  const fgY = useTransform(scrollYProgress, [0, 1], [strength, -strength])

  return (
    <div ref={frameRef} className={`relative aspect-video overflow-hidden ${className ?? ''}`}>
      <motion.div className="absolute -inset-[6%]" style={{ y: bgY }}>
        <PixelatedImage
          src={background.src}
          alt={background.alt}
          width={background.width}
          height={background.height}
          className="h-full w-full"
        />
      </motion.div>
      {foreground && (
        <motion.div className="absolute -inset-[6%]" style={{ y: fgY }}>
          <PixelatedImage
            src={foreground.src}
            alt={foreground.alt}
            width={foreground.width}
            height={foreground.height}
            className="h-full w-full"
            imageClassName="h-full w-full object-contain"
          />
        </motion.div>
      )}
    </div>
  )
}
