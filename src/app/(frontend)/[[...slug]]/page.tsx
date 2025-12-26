import Window from '@/components/organisms/window'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
	const { slug } = await params
	const payload = await getPayload({ config: configPromise })
	const window = await payload.find({
		collection: 'windows',
		where: {
			slug: { equals: slug?.[0] },
		},
		limit: 1,
	})

	if (slug === undefined || slug.length === 0) {
		return <></>
	}

	if (window.totalDocs === 0) {
		return notFound()
	}

	return <Window {...window.docs[0]} />
}
