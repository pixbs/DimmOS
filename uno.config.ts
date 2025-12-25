import { defineConfig, presetAttributify, presetMini, transformerAttributifyJsx } from 'unocss'

const cellUnit = '3.33vw'

export default defineConfig({
	presets: [presetAttributify(), presetMini()],
	theme: {
		colors: {
			background: '#111',
			foreground: '#FFF',
			red: '#FF7474',
			green: '#FACC15',
			blue: '#60A5FA',
			yellow: '#FACC15',
		},
	},
	rules: [
		// Padding
		[/^p-(\d+)cell$/, ([, d]) => ({ padding: `calc(${d} * ${cellUnit})` })],
		[/^pt-(\d+)cell$/, ([, d]) => ({ 'padding-top': `calc(${d} * ${cellUnit})` })],
		[/^pr-(\d+)cell$/, ([, d]) => ({ 'padding-right': `calc(${d} * ${cellUnit})` })],
		[/^pb-(\d+)cell$/, ([, d]) => ({ 'padding-bottom': `calc(${d} * ${cellUnit})` })],
		[/^pl-(\d+)cell$/, ([, d]) => ({ 'padding-left': `calc(${d} * ${cellUnit})` })],
		[
			/^px-(\d+)cell$/,
			([, d]) => ({
				'padding-left': `calc(${d} * ${cellUnit})`,
				'padding-right': `calc(${d} * ${cellUnit})`,
			}),
		],
		[
			/^py-(\d+)cell$/,
			([, d]) => ({
				'padding-top': `calc(${d} * ${cellUnit})`,
				'padding-bottom': `calc(${d} * ${cellUnit})`,
			}),
		],
		// Margin
		[/^m-(\d+)cell$/, ([, d]) => ({ margin: `calc(${d} * ${cellUnit})` })],
		[/^mt-(\d+)cell$/, ([, d]) => ({ 'margin-top': `calc(${d} * ${cellUnit})` })],
		[/^mr-(\d+)cell$/, ([, d]) => ({ 'margin-right': `calc(${d} * ${cellUnit})` })],
		[/^mb-(\d+)cell$/, ([, d]) => ({ 'margin-bottom': `calc(${d} * ${cellUnit})` })],
		[/^ml-(\d+)cell$/, ([, d]) => ({ 'margin-left': `calc(${d} * ${cellUnit})` })],
		[
			/^mx-(\d+)cell$/,
			([, d]) => ({
				'margin-left': `calc(${d} * ${cellUnit})`,
				'margin-right': `calc(${d} * ${cellUnit})`,
			}),
		],
		[
			/^my-(\d+)cell$/,
			([, d]) => ({
				'margin-top': `calc(${d} * ${cellUnit})`,
				'margin-bottom': `calc(${d} * ${cellUnit})`,
			}),
		],
		// Width & Height
		[/^w-(\d+)cell$/, ([, d]) => ({ width: `calc(${d} * ${cellUnit})` })],
		[/^h-(\d+)cell$/, ([, d]) => ({ height: `calc(${d} * ${cellUnit})` })],
		[/^min-w-(\d+)cell$/, ([, d]) => ({ 'min-width': `calc(${d} * ${cellUnit})` })],
		[/^min-h-(\d+)cell$/, ([, d]) => ({ 'min-height': `calc(${d} * ${cellUnit})` })],
		[/^max-w-(\d+)cell$/, ([, d]) => ({ 'max-width': `calc(${d} * ${cellUnit})` })],
		[/^max-h-(\d+)cell$/, ([, d]) => ({ 'max-height': `calc(${d} * ${cellUnit})` })],
		[
			/^size-(\d+)cell$/,
			([, d]) => ({ width: `calc(${d} * ${cellUnit})`, height: `calc(${d} * ${cellUnit})` }),
		],
	],
	transformers: [transformerAttributifyJsx()],
})
