import 'server-only'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Window, Article, Form, WindowButton } from '@/payload-types'
import { extractBehavior, type WindowBehaviorConfig } from '@/utilities/windowBehavior'
import { fetchArticleList, type ArticleListItem } from './articleList'

export type ResolvedArticleListBlock = {
  blockType: 'articleList'
  heading?: string | null
  articles: ArticleListItem[]
}

// Article['content'] is the superset block union (it includes the article-only
// Hero); window content is a subset, so resolved window/article blocks share it.
export type ResolvedBlock =
  | Exclude<NonNullable<Article['content']>[number], { blockType: 'articleList' }>
  | ResolvedArticleListBlock

export type WindowContentResult =
  | { type: 'window'; title: string; blocks: ResolvedBlock[]; buttons: NonNullable<WindowButton>; behavior: WindowBehaviorConfig }
  | { type: 'article'; doc: Article; behavior: WindowBehaviorConfig }
  | { type: 'form'; doc: Form; behavior: WindowBehaviorConfig }
  | null

async function resolveBlocks(
  rawBlocks: NonNullable<Window['content']>,
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<ResolvedBlock[]> {
  return Promise.all(
    rawBlocks.map(async (block): Promise<ResolvedBlock> => {
      if (block.blockType !== 'articleList') return block as ResolvedBlock

      return {
        blockType: 'articleList',
        heading: block.heading,
        articles: await fetchArticleList(block, payload),
      } satisfies ResolvedArticleListBlock
    }),
  )
}

async function fetchWindowContentImpl(slug: string): Promise<WindowContentResult> {
  const payload = await getPayload({ config })

  const { docs: windows } = await payload.find({
    collection: 'windows',
    where: { slug: { equals: slug } },
    overrideAccess: false,
    limit: 1,
    depth: 1,
  })
  if (windows.length) {
    const doc = windows[0]
    const blocks = await resolveBlocks(doc.content ?? [], payload)
    return { type: 'window', title: doc.title, blocks, buttons: doc.buttons ?? [], behavior: extractBehavior(doc) }
  }

  const { docs: articles } = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    overrideAccess: false,
    limit: 1,
    depth: 1,
  })
  if (articles.length) return { type: 'article', doc: articles[0], behavior: extractBehavior(articles[0]) }

  const { docs: forms } = await payload.find({
    collection: 'forms',
    where: { slug: { equals: slug } },
    overrideAccess: false,
    limit: 1,
    depth: 1,
  })
  if (forms.length) return { type: 'form', doc: forms[0]!, behavior: extractBehavior(forms[0]!) }

  return null
}

export const fetchWindowContent = unstable_cache(
  fetchWindowContentImpl,
  ['window-content'],
  { tags: ['window-content'], revalidate: false },
)

export async function fetchAllShortcutContents(
  slugs: string[],
): Promise<Record<string, WindowContentResult>> {
  const results = await Promise.all(slugs.map((slug) => fetchWindowContent(slug)))
  return Object.fromEntries(slugs.map((slug, i) => [slug, results[i]]))
}
