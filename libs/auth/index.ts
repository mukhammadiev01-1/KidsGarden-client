import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { sweetMixinErrorAlert } from '../sweetAlert';
import { GOOGLE_LOGIN, KAKAO_LOGIN, LOGIN, SIGN_UP, TELEGRAM_LOGIN } from '../../apollo/user/mutation';
import { normalizeMemberType } from '../enums/member.enum';

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
		throw new Error('Login Err');
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
		switch (err.graphQLErrors[0].message) {
			case 'Definer: login and password do not match':
				await sweetMixinErrorAlert('Please check your password again');
				break;
			case 'Definer: user has been blocked!':
				await sweetMixinErrorAlert('User has been blocked!');
				break;
		}
		throw new Error('token error');
	}
};

export const signUp = async (nick: string, password: string, phone: string, type: string): Promise<void> => {
	try {
		const { jwtToken } = await requestSignUpJwtToken({ nick, password, phone, type });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
		}
	} catch (err) {
		console.warn('login err', err);
		logOut();
		throw new Error('Login Err');
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
		switch (err.graphQLErrors[0].message) {
			case 'Definer: login and password do not match':
				await sweetMixinErrorAlert('Please check your password again');
				break;
			case 'Definer: user has been blocked!':
				await sweetMixinErrorAlert('User has been blocked!');
				break;
		}
		throw new Error('token error');
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
