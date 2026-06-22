import Head from 'next/head';

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

const buildCanonicalUrl = (path?: string) => {
	if (!path) return '';
	if (path.startsWith('http://') || path.startsWith('https://')) return path;
	if (!SITE_URL) return '';
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const PageSeo = ({ title, description, canonicalPath, image, noindex }: PageSeoProps) => {
	const pageTitle = buildTitle(title);
	const pageDescription = description || DEFAULT_DESCRIPTION;
	const imageUrl = buildPublicUrl(image || DEFAULT_IMAGE);
	const canonicalUrl = buildCanonicalUrl(canonicalPath);
	const robots = noindex ? 'noindex,nofollow' : 'index,follow';

	return (
		<Head>
			<title>{pageTitle}</title>
			<meta name="title" content={pageTitle} key="title" />
			<meta name="description" content={pageDescription} key="description" />
			<meta name="robots" content={robots} key="robots" />
			{canonicalUrl && <link rel="canonical" href={canonicalUrl} key="canonical" />}

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
