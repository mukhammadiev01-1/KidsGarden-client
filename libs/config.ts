const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://127.0.0.1:3000';
const rawGraphqlUrl =
	process.env.NEXT_PUBLIC_API_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL || 'http://127.0.0.1:3000/graphql';

export const REACT_APP_API_URL = rawApiUrl.replace(/\/$/, '');
export const REACT_APP_API_GRAPHQL_URL = rawGraphqlUrl;
export const KINDERGARTEN_IMAGE_PLACEHOLDER = '/img/kindergarten/bigImage.png';

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
