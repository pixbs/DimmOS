export type LinkKind = 'internal' | 'external'

export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

export function classifyHref(href: string): LinkKind {
  return isInternalHref(href) ? 'internal' : 'external'
}

export function getSlugFromHref(href: string): string | null {
  if (!isInternalHref(href)) return null
  const slug = href.split('#')[0]?.split('?')[0]?.replace(/^\//, '') ?? ''
  return slug || null
}

export function toAbsoluteUrl(href: string, origin: string): string {
  try {
    return new URL(href, origin).toString()
  } catch {
    return href
  }
}

export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
