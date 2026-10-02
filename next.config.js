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
	// Per-route stylesheets. Next only lets pages/_app import global CSS; the
	// scss/routes/*.route.scss files reuse that same global pipeline (selectors
	// untouched, no CSS-module renaming) while webpack still chunks them per page,
	// so a visitor downloads the homepage styles only on the homepage.
	webpack(config) {
		const ROUTE_CSS = /[\\/]scss[\\/]routes[\\/][^\\/]+\.route\.scss$/;
		const sample = '/project/scss/routes/home.route.scss';
		const matches = (test) => (Array.isArray(test) ? test : [test]).some((t) => t instanceof RegExp && t.test(sample));
		let template = null;
		for (const rule of config.module.rules) {
			for (const sub of rule.oneOf || []) {
				if (!sub.test || !matches(sub.test)) continue;
				const isErrorRule = sub.use && sub.use.loader && /error-loader/.test(sub.use.loader);
				// Client build: the pages global-Sass rule (issuer restricted to _app,
				// real loader chain). Server build: the ignore-loader rule that stands
				// in for every global stylesheet. Everything else that would match is
				// a module rule or the "global CSS outside _app" error rule.
				if (!template && !isErrorRule && ((Array.isArray(sub.use) && sub.issuer) || typeof sub.use === 'string')) template = { rule, sub };
				sub.exclude = sub.exclude ? [].concat(sub.exclude, ROUTE_CSS) : ROUTE_CSS;
			}
		}
		if (!template) throw new Error(`next.config.js (${config.name}): could not find the global Sass rule to derive the route stylesheet rule from`);
		template.rule.oneOf.unshift({ ...template.sub, test: ROUTE_CSS, include: undefined, issuer: undefined, exclude: undefined });
		return config;
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
