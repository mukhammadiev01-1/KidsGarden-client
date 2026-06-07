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

declare global {
	interface Window {
		Telegram?: {
			Login?: {
				auth: (
					options: {
						client_id: string | number;
						lang?: string;
						nonce?: string;
					},
					callback: (response: { id_token?: string; idToken?: string; error?: string }) => void,
				) => void;
			};
		};
	}
}

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const TELEGRAM_LOGIN_SCRIPT_SRC = 'https://oauth.telegram.org/js/telegram-login.js?3';
let telegramLoginScriptPromise: Promise<void> | null = null;

const loadTelegramLoginScript = (): Promise<void> => {
	if (typeof window === 'undefined') return Promise.reject(new Error('Telegram login is unavailable'));
	if (window.Telegram?.Login?.auth) return Promise.resolve();
	if (telegramLoginScriptPromise) return telegramLoginScriptPromise;

	telegramLoginScriptPromise = new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = TELEGRAM_LOGIN_SCRIPT_SRC;
		script.async = true;
		script.onload = () => {
			if (window.Telegram?.Login?.auth) resolve();
			else reject(new Error('Telegram login failed to load'));
		};
		script.onerror = () => reject(new Error('Telegram login failed to load'));
		document.body.appendChild(script);
	});

	return telegramLoginScriptPromise;
};

const createTelegramNonce = (): string => {
	if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
		throw new Error('Telegram login is unavailable');
	}

	const values = new Uint8Array(24);
	window.crypto.getRandomValues(values);

	return Array.from(values)
		.map((value) => value.toString(16).padStart(2, '0'))
		.join('');
};

const Join: NextPage = () => {
	const router = useRouter();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: MemberType.PARENT });
	const [loginView, setLoginView] = useState<boolean>(true);
	const [telegramLoading, setTelegramLoading] = useState<boolean>(false);
	const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
	const telegramClientId = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID;

	useEffect(() => {
		const mode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode;
		if (mode === 'register') setLoginView(false);
		if (mode === 'login') setLoginView(true);
	}, [router.query.mode]);

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

	const doTelegramLogin = useCallback(async () => {
		if (!telegramClientId || telegramLoading) return;

		try {
			setTelegramLoading(true);
			await loadTelegramLoginScript();
			const nonce = createTelegramNonce();
			const clientId = Number(telegramClientId);
			if (!Number.isSafeInteger(clientId)) {
				throw new Error('Telegram login is not configured');
			}

			await new Promise<void>((resolve, reject) => {
				const originalWindowOpen = window.open.bind(window);
				window.open = ((url?: string | URL, target?: string, features?: string) => {
					if (typeof url === 'string' && url.startsWith('https://oauth.telegram.org/auth')) {
						const telegramAuthUrl = new URL(url);
						if (!telegramAuthUrl.searchParams.has('origin')) {
							telegramAuthUrl.searchParams.set('origin', window.location.origin);
						}
						return originalWindowOpen(telegramAuthUrl.toString(), target, features);
					}

					return originalWindowOpen(url, target, features);
				}) as typeof window.open;

				try {
					window.Telegram?.Login?.auth({ client_id: clientId, lang: 'en', nonce }, async (response) => {
						try {
							if (response?.error) {
								reject(new Error(`Telegram login failed: ${response.error}`));
								return;
							}

							const idToken = response?.id_token || response?.idToken;

							if (!idToken) {
								reject(new Error('Missing Telegram id_token from OIDC response'));
								return;
							}

							await telegramLogIn(idToken, nonce);
							await router.push(`${router.query.referrer ?? '/'}`);
							resolve();
						} catch (err) {
							reject(err);
						}
					});
				} finally {
					window.open = originalWindowOpen as typeof window.open;
				}
			});
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message || 'Telegram login failed');
		} finally {
			setTelegramLoading(false);
		}
	}, [router, telegramClientId, telegramLoading]);

	return (
		<Stack className={'join-page'}>
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
								<Box sx={{ mb: 2 }}>
									{googleClientId ? (
										<GoogleLogin
											onSuccess={(credentialResponse) => doGoogleLogin(credentialResponse.credential)}
											onError={() => sweetMixinErrorAlert('Google login failed')}
											text={loginView ? 'signin_with' : 'signup_with'}
											useOneTap={false}
										/>
									) : (
										<Button variant="outlined" disabled fullWidth>
											Google login unavailable
										</Button>
									)}
								</Box>
								<Box sx={{ mb: 2 }}>
									{/* Telegram OIDC is paused pending BotFather/Web Login id_token confirmation. */}
									<Button variant="outlined" disabled fullWidth>
										Telegram login temporarily unavailable
									</Button>
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
