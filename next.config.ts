import { withPayload } from '@payloadcms/next/withPayload'
import type { Configuration } from 'webpack'

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Your Next.js config here
	webpack: (webpackConfig: Configuration) => {
		webpackConfig.resolve = webpackConfig.resolve || {}
		webpackConfig.resolve.extensionAlias = {
			'.cjs': ['.cts', '.cjs'],
			'.js': ['.ts', '.tsx', '.js', '.jsx'],
			'.mjs': ['.mts', '.mjs'],
		}

		return webpackConfig
	},
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
