'use server'

export type { WindowContentResult, ResolvedBlock, ResolvedArticleListBlock } from '@/lib/windowContent'

export async function getWindowContent(slug: string) {
  const { fetchWindowContent } = await import('@/lib/windowContent')
  return fetchWindowContent(slug)
}
