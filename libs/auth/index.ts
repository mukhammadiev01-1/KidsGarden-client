import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { sweetMixinErrorAlert } from '../sweetAlert';
import { GOOGLE_LOGIN, KAKAO_LOGIN, LOGIN, SIGN_UP, TELEGRAM_LOGIN } from '../../apollo/user/mutation';
import { normalizeMemberType } from '../enums/member.enum';

const DEFAULT_AUTH_ERROR_MESSAGE = 'Something went wrong. Please check your information and try again.';
export const AUTH_NICKNAME_HELPER = '3–20 characters. Letters, numbers, hyphen, or underscore. No spaces.';
export const AUTH_PASSWORD_HELPER = 'Use at least 8 characters.';
export const AUTH_PHONE_HELPER = 'Example: +998937777777 or 01012345678';
export const AUTH_NICKNAME_ERROR = 'Use 3–20 letters, numbers, hyphen, or underscore.';
export const AUTH_PASSWORD_ERROR = 'Use at least 8 characters.';
export const AUTH_PHONE_ERROR = 'Enter a valid phone number, including country code.';

const authNicknamePattern = /^[\p{L}\p{N}_-]{3,20}$/u;
const canonicalPhonePattern = /^\+[1-9]\d{7,14}$/;

export const normalizeAuthNickname = (nick: string): string => nick.trim();

export const normalizeAuthPhone = (phone: string): string => {
	const source = phone.trim();
	let normalizedPhone = source.startsWith('+') ? `+${source.slice(1).replace(/\D/g, '')}` : source.replace(/[\s\-()]/g, '');

	if (!normalizedPhone.startsWith('+')) {
		if (normalizedPhone.startsWith('010')) normalizedPhone = `+82${normalizedPhone.slice(1)}`;
		else if (normalizedPhone.startsWith('998')) normalizedPhone = `+${normalizedPhone}`;
		else if (normalizedPhone.startsWith('82')) normalizedPhone = `+${normalizedPhone}`;
	}

	return normalizedPhone;
};

export const validateAuthNickname = (nick: string): string | null => {
	return authNicknamePattern.test(normalizeAuthNickname(nick)) ? null : AUTH_NICKNAME_ERROR;
};

export const validateSignupPassword = (password: string): string | null => {
	const isValid = password.length >= 8 && password.length <= 72 && password.trim().length > 0;
	return isValid ? null : AUTH_PASSWORD_ERROR;
};

export const validateAuthPhone = (phone: string): string | null => {
	return canonicalPhonePattern.test(normalizeAuthPhone(phone)) ? null : AUTH_PHONE_ERROR;
};

const extractAuthErrorMessage = (err: any): string => {
	const graphMessage = err?.graphQLErrors?.find((error: any) => error?.message)?.message;
	const networkMessage = err?.networkError?.result?.errors?.find((error: any) => error?.message)?.message;
	const directMessage = typeof err?.message === 'string' ? err.message : '';

	return graphMessage || networkMessage || directMessage || '';
};

const mapAuthErrorMessage = (message: string, fallback = DEFAULT_AUTH_ERROR_MESSAGE): string => {
	const normalizedMessage = message.replace(/^Definer:\s*/i, '').trim();
	const lowerMessage = normalizedMessage.toLowerCase();

	if (lowerMessage.includes('already used member nick or phone')) {
		return 'This nickname or phone number is already used.';
	}

	if (lowerMessage === 'this nickname is already used.') {
		return normalizedMessage;
	}

	if (lowerMessage === 'this phone number is already registered.') {
		return normalizedMessage;
	}

	if (lowerMessage === AUTH_NICKNAME_ERROR.toLowerCase()) {
		return AUTH_NICKNAME_ERROR;
	}

	if (lowerMessage === AUTH_PASSWORD_ERROR.toLowerCase()) {
		return AUTH_PASSWORD_ERROR;
	}

	if (lowerMessage === AUTH_PHONE_ERROR.toLowerCase()) {
		return AUTH_PHONE_ERROR;
	}

	if (lowerMessage === 'could not create account. please try again.') {
		return 'Could not create account. Please try again.';
	}

	if (lowerMessage === 'this nickname or phone number is already used.') {
		return normalizedMessage;
	}

	if (lowerMessage.includes('already used member email')) {
		return 'This email is already registered.';
	}

	if (lowerMessage === 'this email is already registered.') {
		return normalizedMessage;
	}

	if (lowerMessage.includes('login and password do not match')) {
		return 'Please check your nickname and password.';
	}

	if (lowerMessage.includes('no member with that member nick') || lowerMessage.includes('wrong password')) {
		return 'Please check your nickname and password.';
	}

	if (lowerMessage === 'please check your nickname and password.') {
		return normalizedMessage;
	}

	if (lowerMessage.includes('user has been blocked') || lowerMessage.includes('you have been blocked')) {
		return 'This account has been blocked.';
	}

	if (lowerMessage === 'this account has been blocked.') {
		return normalizedMessage;
	}

	return fallback;
};

export function getJwtToken(): any {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('accessToken') ?? '';
	}
}

export function setJwtToken(token: string) {
	localStorage.setItem('accessToken', token);
}

export const logIn = async (nick: string, password: string): Promise<void> => {
	try {
		const { jwtToken } = await requestJwtToken({ nick, password });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err) {
		console.warn('login err', err);
		logOut();
		throw new Error(mapAuthErrorMessage(extractAuthErrorMessage(err)));
	}
};

const requestJwtToken = async ({
	nick,
	password,
}: {
	nick: string;
	password: string;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: LOGIN,
			variables: { input: { memberNick: nick, memberPassword: password } },
			fetchPolicy: 'network-only',
		});

		console.log('---------- login ----------');
		const { accessToken } = result?.data?.login;

		return { jwtToken: accessToken };
	} catch (err: any) {
		console.log('request token err', err.graphQLErrors);
		throw new Error(mapAuthErrorMessage(extractAuthErrorMessage(err)));
	}
};

export const signUp = async (nick: string, password: string, phone: string, type: string): Promise<void> => {
	try {
		const { jwtToken } = await requestSignUpJwtToken({
			nick: normalizeAuthNickname(nick),
			password,
			phone: normalizeAuthPhone(phone),
			type,
		});

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err) {
		console.warn('signup err', err);
		logOut();
		throw new Error(mapAuthErrorMessage(extractAuthErrorMessage(err)));
	}
};

export const googleLogIn = async (idToken: string): Promise<void> => {
	try {
		const { jwtToken } = await requestGoogleJwtToken({ idToken });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err) {
		console.warn('google login err', err);
		logOut();
		throw new Error('Google Login Err');
	}
};

export type TelegramAuthIntent = 'LOGIN' | 'SIGNUP';

export interface TelegramAuthData {
	id: string;
	firstName?: string;
	lastName?: string;
	username?: string;
	photoUrl?: string;
	authDate: number;
	hash: string;
}

export const telegramLogIn = async (authData: TelegramAuthData, intent: TelegramAuthIntent): Promise<void> => {
	try {
		const { jwtToken } = await requestTelegramJwtToken({ authData, intent });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err: any) {
		logOut();
		throw new Error(err.message || 'Telegram Login Err');
	}
};

export type KakaoAuthIntent = 'LOGIN' | 'SIGNUP';

export const kakaoLogIn = async (code: string, redirectUri: string, intent: KakaoAuthIntent): Promise<void> => {
	try {
		const { jwtToken } = await requestKakaoJwtToken({ code, redirectUri, intent });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err: any) {
		logOut();
		throw new Error(err.message || 'Kakao Login Err');
	}
};

const requestGoogleJwtToken = async ({ idToken }: { idToken: string }): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: GOOGLE_LOGIN,
			variables: { input: { idToken } },
			fetchPolicy: 'network-only',
		});

		const { accessToken } = result?.data?.googleLogin;

		return { jwtToken: accessToken };
	} catch (err: any) {
		const message = err?.graphQLErrors?.[0]?.message;
		if (message) await sweetMixinErrorAlert(message);
		throw new Error('google token error');
	}
};

const requestTelegramJwtToken = async ({
	authData,
	intent,
}: {
	authData: TelegramAuthData;
	intent: TelegramAuthIntent;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: TELEGRAM_LOGIN,
			variables: { input: { ...authData, intent } },
			fetchPolicy: 'network-only',
		});

		const { accessToken } = result?.data?.telegramLogin;

		return { jwtToken: accessToken };
	} catch (err: any) {
		const message = err?.graphQLErrors?.[0]?.message;
		throw new Error(message || 'telegram token error');
	}
};

const requestKakaoJwtToken = async ({
	code,
	redirectUri,
	intent,
}: {
	code: string;
	redirectUri: string;
	intent: KakaoAuthIntent;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: KAKAO_LOGIN,
			variables: { input: { code, redirectUri, intent } },
			fetchPolicy: 'network-only',
		});

		const { accessToken } = result?.data?.kakaoLogin;

		return { jwtToken: accessToken };
	} catch (err: any) {
		const message = err?.graphQLErrors?.[0]?.message;
		throw new Error(message || 'kakao token error');
	}
};

const requestSignUpJwtToken = async ({
	nick,
	password,
	phone,
	type,
}: {
	nick: string;
	password: string;
	phone: string;
	type: string;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: SIGN_UP,
			variables: {
				input: { memberNick: nick, memberPassword: password, memberPhone: phone, memberType: type },
			},
			fetchPolicy: 'network-only',
		});

		console.log('---------- login ----------');
		const { accessToken } = result?.data?.signup;

		return { jwtToken: accessToken };
	} catch (err: any) {
		console.log('request token err', err.graphQLErrors);
		throw new Error(mapAuthErrorMessage(extractAuthErrorMessage(err)));
	}
};

export const updateStorage = ({ jwtToken }: { jwtToken: any }) => {
	setJwtToken(jwtToken);
	window.localStorage.setItem('login', Date.now().toString());
};

export const updateUserInfo = (jwtToken: any) => {
	if (!jwtToken) return false;

	const claims = decodeJWT<CustomJwtPayload>(jwtToken);
	const memberType = normalizeMemberType(claims.memberType);

	userVar({
		_id: claims._id ?? '',
		memberType,
		memberStatus: claims.memberStatus ?? '',
		memberAuthType: claims.memberAuthType,
		memberPhone: claims.memberPhone ?? '',
		memberNick: claims.memberNick ?? '',
		memberFullName: claims.memberFullName ?? '',
		memberImage:
			claims.memberImage === null || claims.memberImage === undefined
				? '/img/profile/defaultUser.svg'
				: `${claims.memberImage}`,
		memberAddress: claims.memberAddress ?? '',
		memberDesc: claims.memberDesc ?? '',
		memberKindergartens: claims.memberKindergartens ?? claims.memberProperties ?? 0,
		memberRank: claims.memberRank ?? 0,
		memberArticles: claims.memberArticles ?? 0,
		memberPoints: claims.memberPoints ?? 0,
		memberLikes: claims.memberLikes ?? 0,
		memberViews: claims.memberViews ?? 0,
		memberWarnings: claims.memberWarnings ?? 0,
		memberBlocks: claims.memberBlocks ?? 0,
	});
};

export const logOut = () => {
	deleteStorage();
	deleteUserInfo();
};

const deleteStorage = () => {
	localStorage.removeItem('accessToken');
	window.localStorage.setItem('logout', Date.now().toString());
};

const deleteUserInfo = () => {
	userVar({
		_id: '',
		memberType: '',
		memberStatus: '',
		memberAuthType: '',
		memberPhone: '',
		memberNick: '',
		memberFullName: '',
		memberImage: '',
		memberAddress: '',
		memberDesc: '',
		memberKindergartens: 0,
		memberRank: 0,
		memberArticles: 0,
		memberPoints: 0,
		memberLikes: 0,
		memberViews: 0,
		memberWarnings: 0,
		memberBlocks: 0,
	});
};
