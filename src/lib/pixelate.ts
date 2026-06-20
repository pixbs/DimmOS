/**
 * Pure math for the canvas de-pixelation animation used by `PixelatedImage`.
 *
 * The effect draws an image at a deliberately low internal resolution and
 * scales it up with smoothing disabled, producing chunky pixels. Over the
 * animation the internal resolution climbs from a coarse start up to `1`
 * (full resolution), at which point the real `next/image` is shown instead.
 */

/**
 * Build the sequence of resolution factors for the de-pixelation animation.
 *
 * Each returned factor `f` (in `(0, 1]`) means "render the source into a
 * `width*f` × `height*f` buffer, then scale it up to full size with smoothing
 * off". The sequence is eased with {@link https://easings.net/#easeOutQuad ease-out quad}
 * so most of the perceived sharpening happens early, is strictly increasing,
 * starts at `minResolution`, and always ends exactly at `1`.
 *
 * @param stepCount - Number of frames in the animation (clamped to `>= 2`).
 * @param minResolution - Starting resolution factor, e.g. `0.04` for ~4% (clamped to `(0, 1)`).
 * @returns An array of `stepCount` increasing factors, last element `1`.
 */
export function pixelationSteps(stepCount: number, minResolution: number): number[] {
  const count = Math.max(2, Math.floor(stepCount))
  const min = Math.min(0.999, Math.max(0.001, minResolution))
  const steps: number[] = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    // ease-out quad: 1 - (1 - t)^2 — fast early progress, gentle finish.
    const eased = 1 - (1 - t) * (1 - t)
    steps.push(min + (1 - min) * eased)
  }
  steps[steps.length - 1] = 1
  return steps
}

/**
 * Convert a resolution factor to integer buffer dimensions for canvas drawing.
 *
 * Guarantees at least `1` pixel on each axis so the smallest steps still draw.
 *
 * @param width - Target (display) width in pixels.
 * @param height - Target (display) height in pixels.
 * @param resolution - A factor from {@link pixelationSteps}.
 */
export function bufferSize(
  width: number,
  height: number,
  resolution: number,
): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(width * resolution)),
    height: Math.max(1, Math.round(height * resolution)),
  }
}
