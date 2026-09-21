import Head from 'next/head';
import { useRouter } from 'next/router';

interface PageSeoProps {
	title?: string;
	description?: string;
	canonicalPath?: string;
	image?: string;
	noindex?: boolean;
}

const SITE_TITLE = 'KidsGarden';
const DEFAULT_DESCRIPTION =
	'KidsGarden helps families find kindergartens, submit applications, communicate with centers, and manage early learning in one place.';
const DEFAULT_IMAGE = '/img/kidsgarden/kindergartens/kg-01-classroom.png';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

/**
 * Locales that each get their own indexable URL. Must match next-i18next.config.js.
 *
 * `kr` is deliberately absent: it is a legacy alias of `ko` serving identical content,
 * so it is folded into `ko` (see LOCALE_ALIASES) rather than indexed as a duplicate.
 */
const INDEXED_LOCALES = ['en', 'ko', 'ru', 'uz'] as const;
const DEFAULT_LOCALE = 'en';
const LOCALE_ALIASES: Record<string, string> = { kr: 'ko' };

const buildTitle = (title?: string) => {
	if (!title || title === SITE_TITLE) return SITE_TITLE;
	return `${title} | ${SITE_TITLE}`;
};

const buildPublicUrl = (path?: string) => {
	if (!path) return '';
	if (path.startsWith('http://') || path.startsWith('https://')) return path;
	if (!SITE_URL) return path.startsWith('/') ? path : `/${path}`;
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const isAbsolute = (path: string) => path.startsWith('http://') || path.startsWith('https://');

/** Next.js serves the default locale unprefixed and every other locale under /<locale>. */
const localizePath = (path: string, locale: string) => {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	if (locale === DEFAULT_LOCALE) return normalized;
	return `/${locale}${normalized === '/' ? '' : normalized}`;
};

const PageSeo = ({ title, description, canonicalPath, image, noindex }: PageSeoProps) => {
	const { locale } = useRouter();
	const pageTitle = buildTitle(title);
	const pageDescription = description || DEFAULT_DESCRIPTION;
	const imageUrl = buildPublicUrl(image || DEFAULT_IMAGE);
	const robots = noindex ? 'noindex,nofollow' : 'index,follow';

	// The canonical used to ignore the locale, so /ko, /ru and /uz pages all declared the
	// English page canonical -- telling search engines to drop every non-English version
	// as a duplicate. It now points at the page's own language.
	const indexedLocale = LOCALE_ALIASES[locale ?? ''] ?? locale ?? DEFAULT_LOCALE;
	const canLocalize = Boolean(canonicalPath && SITE_URL && !isAbsolute(canonicalPath));
	const canonicalUrl = !canonicalPath
		? ''
		: isAbsolute(canonicalPath)
		? canonicalPath
		: canLocalize
		? `${SITE_URL}${localizePath(canonicalPath, indexedLocale)}`
		: '';

	return (
		<Head>
			<title>{pageTitle}</title>
			<meta name="title" content={pageTitle} key="title" />
			<meta name="description" content={pageDescription} key="description" />
			<meta name="robots" content={robots} key="robots" />
			{canonicalUrl && <link rel="canonical" href={canonicalUrl} key="canonical" />}

			{/* hreflang: tells search engines which URL serves which language, so each
			    audience is sent to its own version. Omitted for noindex pages. */}
			{canLocalize &&
				!noindex &&
				INDEXED_LOCALES.map((lang) => (
					<link
						key={`hreflang-${lang}`}
						rel="alternate"
						hrefLang={lang}
						href={`${SITE_URL}${localizePath(canonicalPath as string, lang)}`}
					/>
				))}
			{canLocalize && !noindex && (
				<link
					key="hreflang-x-default"
					rel="alternate"
					hrefLang="x-default"
					href={`${SITE_URL}${localizePath(canonicalPath as string, DEFAULT_LOCALE)}`}
				/>
			)}

			<meta property="og:title" content={pageTitle} key="og:title" />
			<meta property="og:description" content={pageDescription} key="og:description" />
			<meta property="og:type" content="website" key="og:type" />
			<meta property="og:image" content={imageUrl} key="og:image" />
			{canonicalUrl && <meta property="og:url" content={canonicalUrl} key="og:url" />}

			<meta name="twitter:card" content="summary_large_image" key="twitter:card" />
			<meta name="twitter:title" content={pageTitle} key="twitter:title" />
			<meta name="twitter:description" content={pageDescription} key="twitter:description" />
			<meta name="twitter:image" content={imageUrl} key="twitter:image" />
		</Head>
	);
};

export default PageSeo;
