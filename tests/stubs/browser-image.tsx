/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text -- semantic browser-test replacement for Next Image */
import type { ImgHTMLAttributes } from 'react'

type BrowserImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  fill?: boolean
  priority?: boolean
  src: string | { src: string }
}

export default function BrowserImage({ fill: _fill, priority: _priority, src, ...props }: BrowserImageProps) {
  return <img src={typeof src === 'string' ? src : src.src} {...props} />
}
