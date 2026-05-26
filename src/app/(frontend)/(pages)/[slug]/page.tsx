import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { FormComponent } from '@/components/form/FormComponent'
import { WindowContent } from '@/components/window-content'
import { ArticleContent } from '@/components/article-content'
import { SetWindowTitle } from '@/components/window/title-context'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs: windows } = await payload.find({
    collection: 'windows',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  if (windows.length) {
    return (
      <>
        <SetWindowTitle title={windows[0].title} />
        <WindowContent blocks={windows[0].content ?? []} />
      </>
    )
  }

  const { docs: articles } = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  if (articles.length) {
    return (
      <>
        <SetWindowTitle title={articles[0].title} />
        <ArticleContent article={articles[0]} />
      </>
    )
  }

  const { docs: forms } = await payload.find({
    collection: 'forms',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  if (forms.length) {
    return <FormComponent form={forms[0] as any} />
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
    ...forms.docs.map((d) => ({ slug: (d as any).slug as string })),
  ]
}
