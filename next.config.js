/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Debug logging is useful locally but must not reach visitors' consoles.
	// console.error/warn are kept so real failures stay diagnosable in production.
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
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
