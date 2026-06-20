/**
 * Pure text-splitting helpers for the `AnimatedText` component.
 *
 * Titles are revealed by animating each word or letter up from below. To keep
 * words from breaking across lines mid-animation, text is always split into
 * **word groups** first; in `'letters'` mode each word group is further split
 * into its individual characters. The original, unsplit string is rendered
 * separately (visually hidden) for screen readers — see `AnimatedText`.
 */

/** How `AnimatedText` subdivides a string into animatable units. */
export type SplitMode = 'words' | 'letters'

/**
 * The result of {@link splitText}: an array of word groups, where each group is
 * the ordered list of units to animate for that word.
 *
 * - `'words'` mode: every group holds a single unit (the whole word).
 * - `'letters'` mode: every group holds one unit per character of the word.
 */
export interface SplitTextResult {
  /** Word groups, in source order. Inner arrays are the animatable units. */
  words: string[][]
}

/**
 * Split `text` into animatable word groups for {@link SplitTextResult}.
 *
 * Whitespace runs are collapsed and used only as word separators (the spacing
 * is re-added via layout in `AnimatedText`, not as tokens). An empty or
 * whitespace-only string yields `{ words: [] }`.
 *
 * @param text - The source string (e.g. a section title).
 * @param mode - Whether to animate whole words or individual letters.
 */
export function splitText(text: string, mode: SplitMode): SplitTextResult {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  if (mode === 'words') {
    return { words: words.map((w) => [w]) }
  }
  return { words: words.map((w) => Array.from(w)) }
}
