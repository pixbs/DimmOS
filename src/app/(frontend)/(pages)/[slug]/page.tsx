import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { FormComponent } from '@/components/form/FormComponent'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function FormPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'forms',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  if (!docs.length) notFound()

  return <FormComponent form={docs[0] as any} />
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'forms', limit: 100 })
  return docs.map((doc: any) => ({ slug: doc.slug }))
}
