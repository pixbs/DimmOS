const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s)
}

export function parseOpenWindows(
  searchParams: URLSearchParams | { get(key: string): string | null },
): string[] {
  const raw = searchParams.get('open') ?? ''
  if (!raw) return []
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(isValidSlug))]
}

export function serializeOpenWindows(slugs: string[]): string {
  return slugs.filter(isValidSlug).join(',')
}
