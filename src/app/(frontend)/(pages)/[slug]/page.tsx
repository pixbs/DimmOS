import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FormComponent } from '@/components/form/FormComponent'
import { WindowContent } from '@/components/window-content'
import { ArticleContent } from '@/components/article-content'
import { SetWindowTitle, SetWindowOptions, SetWindowToolbar } from '@/components/window/title-context'
import { generateMeta } from '@/utilities/generateMeta'
import { extractBehavior } from '@/utilities/windowBehavior'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const [{ docs: windows }, { docs: articles }] = await Promise.all([
    payload.find({
      collection: 'windows',
      where: { slug: { equals: slug } },
      select: { title: true, meta: true } as const,
      limit: 1,
      depth: 1,
    }),
    payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      select: { title: true, meta: true } as const,
      limit: 1,
      depth: 1,
    }),
  ])

  const doc = windows[0] ?? articles[0] ?? null
  return generateMeta(doc as any)
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const [{ docs: windows }, { docs: articles }, { docs: forms }] = await Promise.all([
    payload.find({
      collection: 'windows',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    }),
    payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    }),
    payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    }),
  ])

  if (windows.length) {
    const doc = windows[0]
    const behavior = extractBehavior(doc)
    return (
      <>
        <SetWindowTitle title={doc.title} />
        <SetWindowOptions
          disableMinimize={!behavior.collapsible}
          expandable={behavior.expandable}
          resizable={behavior.resizable}
        />
        <SetWindowToolbar
          displaySearch={behavior.displaySearch}
          displayViewToggle={behavior.displayViewToggle}
          defaultView={behavior.defaultView}
          displayHistory={behavior.displayHistory}
        />
        <WindowContent blocks={doc.content ?? []} />
      </>
    )
  }

  if (articles.length) {
    const doc = articles[0]
    const behavior = extractBehavior(doc)
    return (
      <>
        <SetWindowTitle title={doc.title} />
        <SetWindowOptions
          disableMinimize={!behavior.collapsible}
          expandable={behavior.expandable}
          resizable={behavior.resizable}
        />
        <SetWindowToolbar
          displaySearch={behavior.displaySearch}
          displayViewToggle={behavior.displayViewToggle}
          defaultView={behavior.defaultView}
          displayHistory={behavior.displayHistory}
        />
        <ArticleContent article={doc} />
      </>
    )
  }

  if (forms.length) {
    const form = forms[0]
    const behavior = extractBehavior(form)
    return (
      <>
        <SetWindowOptions
          disableMinimize={!behavior.collapsible}
          expandable={behavior.expandable}
          resizable={behavior.resizable}
        />
        <SetWindowToolbar
          displaySearch={behavior.displaySearch}
          displayViewToggle={behavior.displayViewToggle}
          defaultView={behavior.defaultView}
          displayHistory={behavior.displayHistory}
        />
        <FormComponent form={form} />
      </>
    )
  }

  notFound()
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const [windows, articles, forms] = await Promise.all([
    payload.find({ collection: 'windows',  select: { slug: true }, limit: 200, depth: 0 }),
    payload.find({ collection: 'articles', select: { slug: true }, limit: 200, depth: 0 }),
    payload.find({ collection: 'forms',    select: { slug: true }, limit: 200, depth: 0 }),
  ])
  return [
    ...windows.docs.map((d) => ({ slug: d.slug })),
    ...articles.docs.map((d) => ({ slug: d.slug })),
    ...forms.docs.map((d) => ({ slug: d.slug })),
  ]
}
