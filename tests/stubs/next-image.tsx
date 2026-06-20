import React from 'react'

/**
 * Test stub for `next/image`.
 *
 * The DOM test config aliases `next/image` to this component so component tests
 * render a plain `<img>` without Next's image-optimization runtime (which needs
 * a build context). Next-only props are stripped so React doesn't warn about
 * unknown DOM attributes.
 */
export default function Image({
  src,
  alt,
  width,
  height,
  className,
  // Next-only props intentionally dropped:
  priority: _priority,
  fill: _fill,
  quality: _quality,
  loader: _loader,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  sizes: _sizes,
  ...rest
}: Record<string, unknown> & { src?: unknown; alt?: string }) {
  return (
    <img
      src={typeof src === 'string' ? src : ''}
      alt={alt ?? ''}
      width={width as number | undefined}
      height={height as number | undefined}
      className={className as string | undefined}
      {...(rest as Record<string, unknown>)}
    />
  )
}
