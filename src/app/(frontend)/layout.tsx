import Wallpaper from '@/components/molecules/wallpaper'
import configPromise from '@payload-config'
import '@unocss/reset/tailwind.css'
import { getPayload } from 'payload'
import './globals.css'
import Shortcut from '@/components/molecules/shortcut'

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
		},
	})

	return (
		<html lang='en'>
			<body
				bg='background'
				className='relative size-screen'
				text='foreground'
			>
				<div
					border='foreground/10'
					className='p-1cell relative grid grid-cols-[repeat(auto-fill,6.66vw)] grid-rows-[repeat(auto-fill,8.325vw)] size-screen'
				>
					{shortcuts.docs.map((shortcut) => (
						<Shortcut key={shortcut.id}>{shortcut.title}</Shortcut>
					))}
					<Wallpaper />
				</div>
			</body>
		</html>
	)
}
