/**
 * Parse a human-authored stat string into a numeric value plus its surrounding
 * prefix/suffix text, so the number can be animated from 0 while the affixes
 * stay static.
 *
 * The `Stats` block stores each figure as a single free-form string, so this is
 * the parser that drives the `CountUp` animation for values such as `"10Mil"`,
 * `"$1.2K"`, `"98%"`, or `"1,200+"`.
 */

/** A stat string decomposed into its animatable number and static affixes. */
export interface ParsedStat {
  /** The numeric value to count up to (0 when the string contains no number). */
  value: number
  /** Text before the number, e.g. the `"$"` in `"$1.2K"`. */
  prefix: string
  /** Text after the number, e.g. the `"Mil"` in `"10Mil"` or `"%"` in `"98%"`. */
  suffix: string
  /** Decimal places present in the source number (drives count-up formatting). */
  decimals: number
}

/** Matches the first number in a string, allowing thousands commas and a decimal part. */
const NUMBER_RE = /-?\d[\d,]*(?:\.\d+)?/

/**
 * Decompose a stat string into {@link ParsedStat}.
 *
 * Extracts the first numeric run (commas allowed as thousands separators),
 * treating everything before it as the prefix and everything after as the
 * suffix. When no number is present, `value` is `0` and the whole string
 * becomes the suffix.
 *
 * @param input - The raw stat string (e.g. `"10Mil"`).
 */
export function parseStat(input: string): ParsedStat {
  const match = NUMBER_RE.exec(input)
  if (!match) {
    return { value: 0, prefix: '', suffix: input, decimals: 0 }
  }
  const raw = match[0]
  const start = match.index
  const numeric = raw.replace(/,/g, '')
  const dot = numeric.indexOf('.')
  return {
    value: Number.parseFloat(numeric),
    prefix: input.slice(0, start),
    suffix: input.slice(start + raw.length),
    decimals: dot === -1 ? 0 : numeric.length - dot - 1,
  }
}
