const isProduction = process.env.NODE_ENV === 'production';

function getPublicEnv(value: string | undefined, name: string, developmentFallback: string): string {
	if (value) return value;
	if (!isProduction) return developmentFallback;

	throw new Error(`${name} must be configured for production builds.`);
}

function deriveWsUrl(apiUrl: string): string {
	if (apiUrl.startsWith('https://')) return apiUrl.replace(/^https:\/\//, 'wss://');
	if (apiUrl.startsWith('http://')) return apiUrl.replace(/^http:\/\//, 'ws://');

	return apiUrl;
}

const rawApiUrl = getPublicEnv(
	process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL,
	'NEXT_PUBLIC_API_URL',
	'http://127.0.0.1:3000',
);
const rawGraphqlUrl = getPublicEnv(
	process.env.NEXT_PUBLIC_API_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL,
	'NEXT_PUBLIC_API_GRAPHQL_URL',
	'http://127.0.0.1:3000/graphql',
);
const rawWsUrl = getPublicEnv(
	process.env.NEXT_PUBLIC_API_WS || process.env.REACT_APP_API_WS || deriveWsUrl(rawApiUrl),
	'NEXT_PUBLIC_API_WS',
	'ws://127.0.0.1:3007',
);

export const REACT_APP_API_URL = rawApiUrl.replace(/\/$/, '');
export const REACT_APP_API_GRAPHQL_URL = rawGraphqlUrl;
export const REACT_APP_API_WS = rawWsUrl;
export const KAKAO_MAP_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY || '';
export const NAVER_MAPS_KEY_ID = process.env.NEXT_PUBLIC_NAVER_MAPS_KEY_ID || '';
export const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '';
export const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || '';
export const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';
export const TELEGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '';
export const KINDERGARTEN_IMAGE_PLACEHOLDER = '/img/kidsgarden/kindergartens/kg-01-classroom.png';

export const getImageUrl = (imageUrl?: string | null, placeholder: string = KINDERGARTEN_IMAGE_PLACEHOLDER): string => {
	if (!imageUrl) return placeholder;
	if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) return imageUrl;
	if (!REACT_APP_API_URL || REACT_APP_API_URL === 'undefined') return placeholder;

	// Backend upload paths include a directory, e.g. uploads/member/a.jpg.
	// Bare fixture names like test.jpg are not valid backend static paths.
	if (!imageUrl.includes('/')) return placeholder;

	return `${REACT_APP_API_URL}/${imageUrl.replace(/^\//, '')}`;
};

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};
