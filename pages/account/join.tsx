import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { googleLogIn, logIn, signUp, telegramLogIn } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MemberType } from '../../libs/enums/member.enum';
import { GoogleLogin } from '@react-oauth/google';
import { KAKAO_REDIRECT_URI, KAKAO_REST_API_KEY, TELEGRAM_BOT_NAME } from '../../libs/config';
import { TLoginButton, TLoginButtonSize, TUser } from 'react-telegram-auth';
import PageSeo from '../../libs/components/seo/PageSeo';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const createOAuthState = (): string => {
	if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
		throw new Error('Kakao login is unavailable');
	}

	const values = new Uint8Array(24);
	window.crypto.getRandomValues(values);

	return Array.from(values)
		.map((value) => value.toString(16).padStart(2, '0'))
		.join('');
};

const SocialIcon = ({ src, alt }: { src: string; alt: string }) => (
	<img className="social-auth-icon" src={src} alt={alt} aria-hidden="true" />
);

const isValidTelegramBotName = (botName?: string): botName is string => {
	if (!botName) return false;
	return /^[A-Za-z][A-Za-z0-9_]{4,}$/.test(botName.trim()) && !/^\d+$/.test(botName.trim());
};

const Join: NextPage = () => {
	const router = useRouter();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: MemberType.PARENT });
	const [loginView, setLoginView] = useState<boolean>(true);
	const [telegramLoading, setTelegramLoading] = useState<boolean>(false);
	const [telegramBrowserReady, setTelegramBrowserReady] = useState<boolean>(false);
	const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
	const telegramBotName = TELEGRAM_BOT_NAME.trim();
	const hasTelegramBotName = isValidTelegramBotName(telegramBotName);
	const telegramUnavailableReason = !telegramBotName
		? 'missing NEXT_PUBLIC_TELEGRAM_BOT_NAME'
		: !hasTelegramBotName
			? 'invalid NEXT_PUBLIC_TELEGRAM_BOT_NAME'
			: !telegramBrowserReady
				? 'browser APIs unavailable'
				: '';
	const canUseTelegram = !telegramUnavailableReason;

	useEffect(() => {
		const mode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode;
		if (mode === 'register') setLoginView(false);
		if (mode === 'login') setLoginView(true);
	}, [router.query.mode]);

	useEffect(() => {
		setTelegramBrowserReady(typeof window !== 'undefined' && typeof document !== 'undefined');
	}, []);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
	};

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input.nick, input.password, router]);

	const doSignUp = useCallback(async () => {
		try {
			await signUp(input.nick, input.password, input.phone, MemberType.PARENT);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input.nick, input.password, input.phone, router]);

	const submitHandler = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (loginView) await doLogin();
			else await doSignUp();
		},
		[doLogin, doSignUp, loginView],
	);

	const doGoogleLogin = useCallback(
		async (idToken?: string) => {
			if (!idToken) {
				await sweetMixinErrorAlert('Google login did not return a valid token');
				return;
			}

			try {
				await googleLogIn(idToken);
				await router.push(`${router.query.referrer ?? '/'}`);
			} catch (err: any) {
				await sweetMixinErrorAlert(err.message);
			}
		},
		[router],
	);

	const doTelegramLogin = useCallback(async (user: TUser) => {
		if (telegramLoading) return;

		try {
			setTelegramLoading(true);
			const intent = loginView ? 'LOGIN' : 'SIGNUP';
			await telegramLogIn(
				{
					id: String(user.id),
					firstName: user.first_name,
					lastName: user.last_name,
					username: user.username,
					photoUrl: user.photo_url,
					authDate: user.auth_date,
					hash: user.hash,
				},
				intent,
			);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			const errorMessage = err.message || 'Telegram login failed';
			await sweetMixinErrorAlert(errorMessage);
			if (errorMessage.includes('Please sign up first')) {
				await router.push('/account/join?mode=register');
			}
		} finally {
			setTelegramLoading(false);
		}
	}, [loginView, router, telegramLoading]);

	const doKakaoLogin = useCallback(async () => {
		if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
			await sweetMixinErrorAlert('Kakao login is not configured');
			return;
		}

		try {
			const state = createOAuthState();
			const referrer = typeof router.query.referrer === 'string' ? router.query.referrer : '/';
			const intent = loginView ? 'LOGIN' : 'SIGNUP';
			window.sessionStorage.setItem('kakao_oauth_state', state);
			window.sessionStorage.setItem('kakao_oauth_intent', intent);
			window.sessionStorage.setItem('kakao_oauth_referrer', referrer);

			const authorizeUrl = new URL('https://kauth.kakao.com/oauth/authorize');
			authorizeUrl.searchParams.set('response_type', 'code');
			authorizeUrl.searchParams.set('client_id', KAKAO_REST_API_KEY);
			authorizeUrl.searchParams.set('redirect_uri', KAKAO_REDIRECT_URI);
			authorizeUrl.searchParams.set('state', state);

			window.location.assign(authorizeUrl.toString());
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message || 'Kakao login failed');
		}
	}, [loginView, router.query.referrer]);

	return (
		<Stack className={'join-page'}>
			<PageSeo
				title={loginView ? 'Login to KidsGarden' : 'Create KidsGarden Account'}
				description="Securely access KidsGarden as a parent, teacher, or kindergarten admin after role approval."
				canonicalPath="/account/join"
			/>
			<Stack className={'container'}>
				<Stack className={'main'}>
					<Stack component="form" className={'left'} onSubmit={submitHandler}>
							{/* @ts-ignore */}
							<Box className={'logo'}>
								<img src="/img/logo/logoText.svg" alt="" />
								<span>KidsGarden</span>
							</Box>
							<Box className={'info'}>
								<span>{loginView ? 'login' : 'signup'}</span>
								<p>{loginView ? 'Log in' : 'Sign up'} to continue with KidsGarden.</p>
							</Box>
							<Box className={'input-wrap'}>
								<div className={'input-box'}>
									<span>Nickname</span>
									<input
										id={loginView ? 'login-username' : 'register-username'}
										name="username"
										type="text"
										placeholder={'Enter Nickname'}
										value={input.nick}
										autoComplete="username"
										onChange={(e) => handleInput('nick', e.target.value)}
										required={true}
									/>
								</div>
								<div className={'input-box'}>
									<span>Password</span>
									<input
										id={loginView ? 'login-password' : 'register-password'}
										name="password"
										type="password"
										placeholder={'Enter Password'}
										value={input.password}
										autoComplete={loginView ? 'current-password' : 'new-password'}
										onChange={(e) => handleInput('password', e.target.value)}
										required={true}
									/>
								</div>
								{!loginView && (
									<div className={'input-box'}>
										<span>Phone</span>
										<input
											id="register-phone"
											name="tel"
											type="tel"
											placeholder={'Enter Phone'}
											value={input.phone}
											autoComplete="tel"
											onChange={(e) => handleInput('phone', e.target.value)}
											required={true}
										/>
									</div>
								)}
							</Box>
							<Box className={'register'}>
								<Box className="social-auth-row" sx={{ mb: 2 }}>
									{googleClientId ? (
										<GoogleLogin
											onSuccess={(credentialResponse) => doGoogleLogin(credentialResponse.credential)}
											onError={() => sweetMixinErrorAlert('Google login failed')}
											text={loginView ? 'signin_with' : 'signup_with'}
											useOneTap={false}
											width="470"
										/>
									) : (
										<Button
											className="social-auth-button social-auth-button--google"
											variant="outlined"
											disabled
											fullWidth
											startIcon={<SocialIcon src="/img/icons/social/google.svg" alt="" />}
										>
											Google login unavailable
										</Button>
									)}
								</Box>
								<Box className="social-auth-row" sx={{ mb: 2 }}>
									{canUseTelegram ? (
										<Box
											className={`telegram-widget-area ${telegramLoading ? 'is-loading' : ''}`}
											aria-label={loginView ? 'Login with Telegram' : 'Sign up with Telegram'}
										>
											<TLoginButton
												key={`${telegramBotName}-${loginView ? 'login' : 'signup'}`}
												botName={telegramBotName}
												buttonSize={TLoginButtonSize.Large}
												onAuthCallback={doTelegramLogin}
												usePic={false}
												lang="en"
												additionalClassNames="telegram-widget-button"
											/>
										</Box>
									) : (
										<Button
											className="social-auth-button social-auth-button--telegram"
											variant="outlined"
											disabled
											fullWidth
											startIcon={<SocialIcon src="/img/icons/social/telegram.svg" alt="" />}
										>
											{loginView ? 'Login with Telegram unavailable' : 'Sign up with Telegram unavailable'}
										</Button>
									)}
								</Box>
								<Box className="social-auth-row" sx={{ mb: 2 }}>
									{KAKAO_REST_API_KEY && KAKAO_REDIRECT_URI ? (
										<Button
											className="social-auth-button social-auth-button--kakao"
											variant="outlined"
											fullWidth
											onClick={doKakaoLogin}
											startIcon={<SocialIcon src="/img/icons/social/kakao.svg" alt="" />}
										>
											{loginView ? 'Login with Kakao' : 'Sign up with Kakao'}
										</Button>
									) : (
										<Button
											className="social-auth-button social-auth-button--kakao"
											variant="outlined"
											disabled
											fullWidth
											startIcon={<SocialIcon src="/img/icons/social/kakao.svg" alt="" />}
										>
											Kakao login unavailable
										</Button>
									)}
								</Box>
								{!loginView && (
									<div className={'type-option'}>
										<span className={'text'}>I want to be registered as:</span>
										<div>
											<FormGroup>
												<FormControlLabel
													control={<Checkbox size="small" name={MemberType.PARENT} checked={true} disabled />}
													label="Parent"
												/>
											</FormGroup>
										</div>
										<p className={'helper-text'}>Teachers and kindergarten admins must be invited or approved by a center.</p>
									</div>
								)}

								{loginView && (
									<div className={'remember-info'}>
										<FormGroup>
											<FormControlLabel control={<Checkbox defaultChecked size="small" />} label="Remember me" />
										</FormGroup>
										<a>Lost your password?</a>
									</div>
								)}

								{loginView ? (
									<Button
										type="submit"
										variant="contained"
										endIcon={<img src="/img/icons/rightup.svg" alt="" />}
										disabled={input.nick == '' || input.password == ''}
									>
										LOGIN
									</Button>
								) : (
									<Button
										type="submit"
										variant="contained"
										disabled={input.nick == '' || input.password == '' || input.phone == ''}
										endIcon={<img src="/img/icons/rightup.svg" alt="" />}
									>
										SIGNUP
									</Button>
								)}
							</Box>
							<Box className={'ask-info'}>
								{loginView ? (
									<p>
										Not registered yet?
										<b
											onClick={() => {
												viewChangeHandler(false);
											}}
										>
											SIGNUP
										</b>
									</p>
								) : (
									<p>
										Have account?
										<b onClick={() => viewChangeHandler(true)}> LOGIN</b>
									</p>
								)}
							</Box>
					</Stack>
					<Stack className={'right'}></Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Join);
