import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export default async function ServicesPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'articles',
    where: { type: { equals: 'service' } },
    select: { title: true, slug: true, shortcutIcon: true },
    depth: 0,
    limit: 24,
  })

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-fg">Services</h1>
      {docs.length === 0 ? (
        <p className="text-fg/40 text-sm">No services yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {docs.map((article) => (
            <Link
              key={article.id}
              href={`/${article.slug}`}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors"
              data-article-card
            >
              <span className="text-2xl">{article.shortcutIcon ?? '📋'}</span>
              <span className="font-medium text-fg">{article.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
