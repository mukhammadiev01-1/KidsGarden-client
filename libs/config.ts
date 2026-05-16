const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:7007';

export const REACT_APP_API_URL = rawApiUrl.replace(/\/$/, '');
export const KINDERGARTEN_IMAGE_PLACEHOLDER = '/img/property/bigImage.png';

export const getImageUrl = (imageUrl?: string | null, placeholder: string = KINDERGARTEN_IMAGE_PLACEHOLDER): string => {
	if (!imageUrl) return placeholder;
	if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) return imageUrl;
	if (!REACT_APP_API_URL || REACT_APP_API_URL === 'undefined') return placeholder;

	// Backend upload paths include a directory, e.g. uploads/member/a.jpg.
	// Bare fixture names like test.jpg are not valid backend static paths.
	if (!imageUrl.includes('/')) return placeholder;

	return `${REACT_APP_API_URL}/${imageUrl.replace(/^\//, '')}`;
};

export const availableOptions = ['propertyBarter', 'propertyRent'];

const thisYear = new Date().getFullYear();

export const propertyYears: any = [];

for (let i = 1970; i <= thisYear; i++) {
	propertyYears.push(String(i));
}

export const propertySquare = [0, 25, 50, 75, 100, 125, 150, 200, 300, 500];

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

const topPropertyRank = 50;
