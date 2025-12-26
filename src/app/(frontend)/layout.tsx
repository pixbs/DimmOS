import '@unocss/reset/tailwind.css'
import './globals.css'
import Desktop from '@/components/organisms/desktop'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
	description: 'A blank template using Payload in a Next.js app.',
	title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
	const { children } = props

	const payload = await getPayload({ config: configPromise })
	const shortcuts = await payload.find({
		collection: 'windows',
		where: {
			shortcut: { equals: true },
		},
		select: {
			title: true,
			slug: true,
			id: true,
		},
	})

	return (
		<html lang='en'>
			<body
				bg='background'
				className='relative size-screen'
				text='foreground'
			>
				{children}
				<Desktop shortcuts={shortcuts.docs} />
			</body>
		</html>
	)
}
