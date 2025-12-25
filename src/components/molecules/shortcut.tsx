import { randomInt } from 'crypto'

type Props = {
	children: string
}

const colors = [
	{ name: 'Red', bg: 'bg-red hover:bg-red/80' },
	{ name: 'Green', bg: 'bg-green hover:bg-green/80' },
	{ name: 'Blue', bg: 'bg-blue hover:bg-blue/80' },
	{ name: 'Yellow', bg: 'bg-yellow hover:bg-yellow/80' },
] as const

export default function Shortcut(props: Props) {
	const { children = 'Hey' } = props
	const color = colors[randomInt(0, colors.length)]

	return (
		<div className='flex flex-col items-center gap-1'>
			<div
				className={`size-1cell border-foreground/20 rounded-sm text-center transition-colors duration-200 ease-in-out ${color.bg}`}
			>
				{color.name}
			</div>
			<div bg='background'>{children}</div>
		</div>
	)
}
