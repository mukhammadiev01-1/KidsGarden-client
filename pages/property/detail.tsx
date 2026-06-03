import type { GetServerSideProps, NextPage } from 'next';
import type { ParsedUrlQuery } from 'querystring';

const buildRedirectDestination = (
	basePath: string,
	query: ParsedUrlQuery,
	locale?: string,
	defaultLocale?: string,
): string => {
	const params = new URLSearchParams();

	Object.entries(query).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			value.forEach((item) => params.append(key, item));
			return;
		}

		if (typeof value === 'string') params.append(key, value);
	});

	const localizedBasePath = locale && locale !== defaultLocale ? `/${locale}${basePath}` : basePath;
	const queryString = params.toString();

	return queryString ? `${localizedBasePath}?${queryString}` : localizedBasePath;
};

export const getServerSideProps: GetServerSideProps = async ({ query, locale, defaultLocale }) => ({
	redirect: {
		destination: buildRedirectDestination('/kindergartens/detail', query, locale, defaultLocale),
		permanent: false,
	},
});

const KindergartenDetailCompatibilityRedirect: NextPage = () => null;

export default KindergartenDetailCompatibilityRedirect;
