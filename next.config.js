/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Debug logging is useful locally but must not reach visitors' consoles.
	// console.error/warn are kept so real failures stay diagnosable in production.
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
	},
	// The photo library was PNG (2.8 MB per 1448x1086 image, 244 MB in public/).
	// Photos are now JPEG under the same basename; the database and older
	// content still reference the .png names, so any .png that no longer exists
	// on disk falls through to its .jpg (afterFiles = only when no such file).
	async rewrites() {
		return {
			beforeFiles: [],
			// No `locale: false`: Next matches public-file requests against the
			// locale-prefixed path, so the default locale handling must stay on.
			afterFiles: [{ source: '/img/:path(.*)\\.png', destination: '/img/:path.jpg' }],
			fallback: [],
		};
	},
	env: {
		REACT_APP_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.NEXT_PUBLIC_API_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL,
		REACT_APP_REALTIME_WS_URL:
			process.env.NEXT_PUBLIC_REALTIME_WS_URL || process.env.REACT_APP_REALTIME_WS_URL,
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

module.exports = nextConfig;
