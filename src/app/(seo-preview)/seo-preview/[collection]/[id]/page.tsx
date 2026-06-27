import type { CSSProperties } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ArticleContent } from '@/components/article-content'
import { SeoPreviewFrame } from '@/components/seo-preview/seo-preview-frame'
import { WindowContent } from '@/components/window-content'
import type { Article, Window as WindowDoc } from '@/payload-types'
import { extractBehavior } from '@/utilities/windowBehavior'
import type { SeoImageSourceCollection } from '@/lib/seo-image/types'

type PageProps = {
  params: Promise<{
    collection: string
    id: string
  }>
}

const PREVIEW_PAGE_STYLE = {
  '--header-height': '0px',
} as CSSProperties

function isPreviewCollection(value: string): value is SeoImageSourceCollection {
  return value === 'windows' || value === 'articles'
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SeoPreviewPage({ params }: PageProps) {
  const { collection, id } = await params
  if (!isPreviewCollection(collection)) notFound()

  const payload = await getPayload({ config })
  const doc = await payload.findByID({
    collection,
    depth: 1,
    id,
    overrideAccess: true,
  })

  if (!doc) notFound()

  const behavior = extractBehavior(doc)
  const toolbarBehavior = {
    defaultView: behavior.defaultView,
    displayHistory: behavior.displayHistory,
    displaySearch: behavior.displaySearch,
    displayViewToggle: behavior.displayViewToggle,
  }

  return (
    <main
      data-seo-preview-page=""
      className="relative h-screen w-screen overflow-hidden"
      style={PREVIEW_PAGE_STYLE}
    >
      <SeoPreviewFrame title={doc.title} behavior={toolbarBehavior}>
        {collection === 'windows' ? (
          <WindowContent
            blocks={(doc as WindowDoc).content ?? []}
            buttons={(doc as WindowDoc).buttons}
          />
        ) : (
          <ArticleContent article={doc as Article} />
        )}
      </SeoPreviewFrame>
    </main>
  )
}
