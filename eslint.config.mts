import { FlatCompat } from '@eslint/eslintrc'
import unocss from '@unocss/eslint-config/flat'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
	baseDirectory: __dirname,
})

const eslintConfig = [
	unocss,
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	eslintPluginPrettier,
	{
		rules: {
			'@typescript-eslint/ban-ts-comment': 'warn',
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: false,
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^(_|ignore)',
				},
			],
			'react/jsx-sort-props': [
				'warn',
				{
					callbacksLast: true,
					shorthandLast: true,
					ignoreCase: true,
				},
			],
		},
	},
	{
		ignores: ['.next/', 'src/payload-types.ts', 'src/app/(payload)/admin/'],
	},
]

export default eslintConfig
