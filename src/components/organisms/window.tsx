import type { Window } from '@/payload-types'
import Link from 'next/link'

export default function Window(props: Window) {
	const { title, slug } = props
	return (
		<div
			className='absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6cell h-60 flex flex-col rounded-xl'
			bg='background'
			border='foreground/10 1'
			overflow='hidden'
		>
			<div
				className='flex flex-row h-10 w-full items-center gap-10 px-2'
				bg='background'
				border-b='foreground/10 1'
			>
				<div className='w-full'>
					<Link href='/'>
						<div className='size-3 p-1.5 bg-red rounded-full m-0.25' />
					</Link>
				</div>
				<div className='shrink-0'>~/{slug}</div>
				<div className='w-full' />
			</div>
			<div className='flex items-center justify-center h-full w-full'>{title}</div>
		</div>
	)
}
