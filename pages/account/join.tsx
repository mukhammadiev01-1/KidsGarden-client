import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Button, Checkbox, FormControlLabel, FormGroup, IconButton } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
	AUTH_NICKNAME_HELPER,
	AUTH_PASSWORD_HELPER,
	AUTH_PHONE_HELPER,
	googleLogIn,
	logIn,
	normalizeAuthPhone,
	signUp,
	validateAuthNickname,
	validateAuthPhone,
	validateSignupPassword,
	telegramLogIn,
} from '../../libs/auth';
import { sweetAuthErrorAlert, sweetMixinErrorAlert, sweetWarningAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MemberType } from '../../libs/enums/member.enum';
import { GoogleLogin } from '@react-oauth/google';
import { KAKAO_REDIRECT_URI, KAKAO_REST_API_KEY, TELEGRAM_BOT_NAME } from '../../libs/config';
import { TLoginButton, TLoginButtonSize, TUser } from 'react-telegram-auth';
import PageSeo from '../../libs/components/seo/PageSeo';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import {
	DEFAULT_LOCALE,
	LANGUAGES,
	LEGACY_KOREAN_LOCALE,
	hasLocalePathPrefix,
	normalizeLocale,
} from '../../libs/i18n/languages';

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
	const { t } = useTranslation('common');
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: MemberType.PARENT });
	const [formErrors, setFormErrors] = useState<{ nick?: string; phone?: string; password?: string }>({});
	const [loginView, setLoginView] = useState<boolean>(true);
	const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
	const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
	const [telegramLoading, setTelegramLoading] = useState<boolean>(false);
	const [telegramBrowserReady, setTelegramBrowserReady] = useState<boolean>(false);
	const [telegramDomainSupported, setTelegramDomainSupported] = useState<boolean>(false);
	const [selectedLocale, setSelectedLocale] = useState<string>('en');
	const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
	const telegramBotName = TELEGRAM_BOT_NAME.trim();
	const hasTelegramBotName = isValidTelegramBotName(telegramBotName);
	const telegramUnavailableReason = !telegramBotName
		? 'missing NEXT_PUBLIC_TELEGRAM_BOT_NAME'
		: !hasTelegramBotName
			? 'invalid NEXT_PUBLIC_TELEGRAM_BOT_NAME'
			: !telegramBrowserReady
				? 'browser APIs unavailable'
				: !telegramDomainSupported
					? 'Telegram login is unavailable on this local domain'
					: '';
	const canUseTelegram = !telegramUnavailableReason;
	const telegramWidgetLocale = ['ko', 'ru', 'uz'].includes(selectedLocale) ? selectedLocale : 'en';

	useEffect(() => {
		const mode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode;
		if (mode === 'register') setLoginView(false);
		if (mode === 'login') setLoginView(true);
		setFormErrors({});
	}, [router.query.mode]);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		if (router.locale === LEGACY_KOREAN_LOCALE) {
			setSelectedLocale('ko');
			localStorage.setItem('locale', 'ko');
			router.replace(router.asPath, router.asPath, { locale: 'ko' }).catch(() => undefined);
			return;
		}

		const storedLocale = normalizeLocale(localStorage.getItem('locale'));
		const routeLocale = normalizeLocale(router.locale || DEFAULT_LOCALE);
		const hasRouteLocale = hasLocalePathPrefix(window.location.pathname);
		const nextLocale = hasRouteLocale ? routeLocale : storedLocale;

		setSelectedLocale(nextLocale);
		localStorage.setItem('locale', nextLocale);

		if (!hasRouteLocale && nextLocale !== routeLocale) {
			router.replace(router.asPath, router.asPath, { locale: nextLocale }).catch(() => undefined);
		}
	}, [router]);

	useEffect(() => {
		const browserReady = typeof window !== 'undefined' && typeof document !== 'undefined';
		setTelegramBrowserReady(browserReady);

		if (browserReady) {
			const hostname = window.location.hostname;
			setTelegramDomainSupported(!['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname));
		}
	}, []);

	/** HANDLERS **/
	const routeToAuthMode = async (mode: 'login' | 'register') => {
		await router.push(mode === 'login' ? '/account/login' : '/account/join?mode=register');
	};

	const localeChangeHandler = useCallback(
		async (locale: string) => {
			const nextLocale = normalizeLocale(locale);
			setSelectedLocale(nextLocale);
			if (typeof window !== 'undefined') localStorage.setItem('locale', nextLocale);
			await router.push(router.asPath, router.asPath, { locale: nextLocale });
		},
		[router],
	);

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
		setFormErrors((prev) => {
			if (!prev[name as keyof typeof prev]) return prev;
			return { ...prev, [name]: undefined };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetAuthErrorAlert('Login Error', err.message);
		}
	}, [input.nick, input.password, router]);

	const doSignUp = useCallback(async () => {
		const normalizedPhone = normalizeAuthPhone(input.phone);
		const nextErrors = {
			nick: validateAuthNickname(input.nick) || undefined,
			phone: validateAuthPhone(input.phone) || undefined,
			password: validateSignupPassword(input.password) || undefined,
		};
		const firstError = nextErrors.nick || nextErrors.phone || nextErrors.password;

		setFormErrors(nextErrors);
		if (firstError) {
			await sweetWarningAlert(firstError);
			return;
		}

		try {
			setInput((prev) => ({ ...prev, phone: normalizedPhone }));
			await signUp(input.nick, input.password, normalizedPhone, MemberType.PARENT);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetAuthErrorAlert('Signup Error', err.message);
		}
	}, [input.nick, input.password, input.phone, router]);

	const submitHandler = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (authSubmitting) return;
			setAuthSubmitting(true);
			try {
				if (loginView) await doLogin();
				else await doSignUp();
			} finally {
				setAuthSubmitting(false);
			}
		},
		[authSubmitting, doLogin, doSignUp, loginView],
	);

	const doGoogleLogin = useCallback(
		async (idToken?: string) => {
			if (!idToken) {
				await sweetMixinErrorAlert(t('auth.googleMissingToken'));
				return;
			}

			try {
				await googleLogIn(idToken);
				await router.push(`${router.query.referrer ?? '/'}`);
			} catch (err: any) {
				await sweetMixinErrorAlert(err.message);
			}
		},
		[router, t],
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
			const errorMessage = err.message || t('auth.telegramFailed');
			await sweetMixinErrorAlert(errorMessage);
			if (errorMessage.includes('Please sign up first')) {
				await router.push('/account/join?mode=register');
			}
		} finally {
			setTelegramLoading(false);
		}
	}, [loginView, router, telegramLoading, t]);

	const doKakaoLogin = useCallback(async () => {
		if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
			await sweetMixinErrorAlert(t('auth.kakaoNotConfigured'));
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
			const errorMessage =
				err.message === 'Kakao login is unavailable' ? t('auth.kakaoUnavailable') : err.message || t('auth.kakaoFailed');
			await sweetMixinErrorAlert(errorMessage);
		}
	}, [loginView, router.query.referrer, t]);

	return (
		<div className={'join-page'} data-auth-mode={loginView ? 'login' : 'register'}>
			<PageSeo
				title={t(loginView ? 'auth.seoLoginTitle' : 'auth.seoRegisterTitle')}
				description={t('auth.seoDescription')}
				canonicalPath="/account/join"
			/>
			<div className={'auth-shell'}>
				<div className={'auth-topbar'}>
					<button type="button" className={'auth-brand'} onClick={() => router.push('/')}>
						<img src="/img/logo/kidsgarden-mark.svg" alt="" />
						<span>KidsGarden</span>
					</button>
					<label className={'auth-language'} aria-label={t('auth.languageSelector')}>
						<LanguageRoundedIcon />
						<select value={selectedLocale} onChange={(event) => localeChangeHandler(event.target.value)}>
							{LANGUAGES.map((language) => (
								<option value={language.code} key={language.code}>
									{language.label}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className={'auth-card-zone'}>
					<form className={'auth-card'} onSubmit={submitHandler}>
						<div className={'auth-heading'}>
							<h1>{t(loginView ? 'auth.loginTitle' : 'auth.registerTitle')}</h1>
							<p>{t(loginView ? 'auth.loginSubtitle' : 'auth.registerSubtitle')}</p>
						</div>

						<div className={'input-wrap'}>
							<label className={'input-box'} htmlFor={loginView ? 'login-username' : 'register-username'}>
								<span>{t('auth.nickname')}</span>
								<div className={'auth-input-shell'}>
									<PersonOutlineRoundedIcon />
									<input
										id={loginView ? 'login-username' : 'register-username'}
										name="username"
										type="text"
										placeholder={loginView ? t('auth.nickname') : t('auth.chooseNickname')}
										value={input.nick}
										autoComplete="username"
										onChange={(e) => handleInput('nick', e.target.value)}
										aria-invalid={Boolean(formErrors.nick)}
										aria-describedby={!loginView ? 'register-username-help register-username-error' : undefined}
										required={true}
									/>
								</div>
								{!loginView && (
									<>
										<p id="register-username-help" className={'auth-field-help'}>
											{AUTH_NICKNAME_HELPER}
										</p>
										{formErrors.nick && (
											<p id="register-username-error" className={'auth-field-error'}>
												{formErrors.nick}
											</p>
										)}
									</>
								)}
							</label>

							{!loginView && (
								<label className={'input-box'} htmlFor="register-phone">
									<span>{t('auth.phoneNumber')}</span>
									<div className={'auth-input-shell'}>
										<PhoneOutlinedIcon />
										<input
											id="register-phone"
											name="tel"
											type="tel"
											placeholder={t('auth.phoneNumber')}
											value={input.phone}
											autoComplete="tel"
											onChange={(e) => handleInput('phone', e.target.value)}
											aria-invalid={Boolean(formErrors.phone)}
											aria-describedby="register-phone-help register-phone-error"
											required={true}
										/>
									</div>
									<p id="register-phone-help" className={'auth-field-help'}>
										{AUTH_PHONE_HELPER}
									</p>
									{formErrors.phone && (
										<p id="register-phone-error" className={'auth-field-error'}>
											{formErrors.phone}
										</p>
									)}
								</label>
							)}

							<label className={'input-box'} htmlFor={loginView ? 'login-password' : 'register-password'}>
								<span>{t('auth.password')}</span>
								<div className={'auth-input-shell'}>
									<LockOutlinedIcon />
									<input
										id={loginView ? 'login-password' : 'register-password'}
										name="password"
										type={passwordVisible ? 'text' : 'password'}
										placeholder={t('auth.password')}
										value={input.password}
										autoComplete={loginView ? 'current-password' : 'new-password'}
										onChange={(e) => handleInput('password', e.target.value)}
										aria-invalid={Boolean(formErrors.password)}
										aria-describedby={!loginView ? 'register-password-help register-password-error' : undefined}
										required={true}
									/>
									<IconButton
										type="button"
										className={'password-toggle'}
										aria-label={t(passwordVisible ? 'auth.hidePassword' : 'auth.showPassword')}
										onClick={() => setPasswordVisible((prev) => !prev)}
									>
										{passwordVisible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
									</IconButton>
								</div>
								{!loginView && (
									<>
										<p id="register-password-help" className={'auth-field-help'}>
											{AUTH_PASSWORD_HELPER}
										</p>
										{formErrors.password && (
											<p id="register-password-error" className={'auth-field-error'}>
												{formErrors.password}
											</p>
										)}
									</>
								)}
							</label>
						</div>

						<div className={'auth-options'}>
							{loginView ? (
								<div className={'remember-info'}>
									<FormGroup>
										<FormControlLabel control={<Checkbox defaultChecked size="small" />} label={t('auth.rememberMe')} />
									</FormGroup>
									<span className="auth-unavailable" aria-disabled="true" title={t('auth.passwordResetComingSoon')}>
										{t('auth.forgotPassword')}
									</span>
								</div>
							) : (
								<div className={'type-option'}>
									<FormGroup>
										<FormControlLabel
											control={<Checkbox size="small" name={MemberType.PARENT} checked={true} disabled />}
											label={t('auth.parentAccount')}
										/>
									</FormGroup>
									<p className={'helper-text'}>{t('auth.approvalCopy')}</p>
								</div>
							)}
						</div>

						<Button className={'auth-primary'} type="submit" variant="contained" disabled={authSubmitting}>
							{authSubmitting
								? loginView
									? t('auth.signingIn')
									: t('auth.creatingAccount')
								: loginView
									? t('auth.continue')
									: t('auth.createAccount')}
						</Button>

						<div className={'auth-divider'}>
							<span />
							<p>{t('auth.orContinueWith')}</p>
							<span />
						</div>

						<div className={'auth-social-grid'}>
							<div className={'social-auth-tile social-auth-tile--google'}>
								{googleClientId ? (
									<>
										<SocialIcon src="/img/icons/social/google.svg" alt="Google" />
										<div className={'google-oauth-hitbox'}>
											<GoogleLogin
												onSuccess={(credentialResponse) => doGoogleLogin(credentialResponse.credential)}
												onError={() => sweetMixinErrorAlert(t('auth.googleFailed'))}
												type="icon"
												shape="rectangular"
												theme="outline"
												size="large"
												text={loginView ? 'signin_with' : 'signup_with'}
												useOneTap={false}
											/>
										</div>
									</>
								) : (
									<button type="button" disabled title={t('auth.googleUnavailable')} aria-label={t('auth.googleUnavailable')}>
										<SocialIcon src="/img/icons/social/google.svg" alt="" />
									</button>
								)}
							</div>

							<div className={'social-auth-tile social-auth-tile--telegram'}>
								{canUseTelegram ? (
									<div
										className={`telegram-widget-area ${telegramLoading ? 'is-loading' : ''}`}
										aria-label={t(loginView ? 'auth.telegramLogin' : 'auth.telegramSignup')}
									>
										<div className="telegram-visual-button" aria-hidden="true">
											<SocialIcon src="/img/icons/social/telegram.svg" alt="" />
											<span>{t(loginView ? 'auth.telegramLogin' : 'auth.telegramSignup')}</span>
										</div>
										<div className="telegram-widget-hitbox">
											<TLoginButton
												key={`${telegramBotName}-${loginView ? 'login' : 'signup'}-${telegramWidgetLocale}`}
												botName={telegramBotName}
												buttonSize={TLoginButtonSize.Large}
												onAuthCallback={doTelegramLogin}
												usePic={false}
												lang={telegramWidgetLocale}
												additionalClassNames="telegram-widget-button"
											/>
										</div>
									</div>
								) : (
									<button
										type="button"
										className="telegram-unavailable-button"
										disabled
										title={t('auth.telegramUnavailable')}
										aria-label={t('auth.telegramUnavailable')}
									>
										<SocialIcon src="/img/icons/social/telegram.svg" alt="" />
										<span>{t('auth.telegramUnavailable')}</span>
									</button>
								)}
							</div>

							<div className={'social-auth-tile social-auth-tile--kakao'}>
								<button
									type="button"
									onClick={doKakaoLogin}
									disabled={!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI}
									title={KAKAO_REST_API_KEY && KAKAO_REDIRECT_URI ? t('auth.kakaoContinue') : t('auth.kakaoUnavailable')}
									aria-label={t(loginView ? 'auth.kakaoLogin' : 'auth.kakaoSignup')}
								>
									<SocialIcon src="/img/icons/social/kakao.svg" alt="" />
								</button>
							</div>
						</div>

						<div className={'ask-info'}>
							{loginView ? (
								<p>
									{t('auth.noAccount')}
									<button type="button" className="auth-mode-link" onClick={() => routeToAuthMode('register')}>
										{t('auth.createAccount')}
									</button>
								</p>
							) : (
								<p>
									{t('auth.alreadyAccount')}
									<button type="button" className="auth-mode-link" onClick={() => routeToAuthMode('login')}>
										{t('auth.signIn')}
									</button>
								</p>
							)}
						</div>
					</form>
				</div>

				<div className={'auth-trustbar'}>
					<div>
						<ShieldOutlinedIcon />
						<span>{t('auth.safeTitle')}</span>
						<p>{t('auth.safeCopy')}</p>
					</div>
					<div>
						<FavoriteBorderRoundedIcon />
						<span>{t('auth.parentFirstTitle')}</span>
						<p>{t('auth.parentFirstCopy')}</p>
					</div>
					<div>
						<TouchAppOutlinedIcon />
						<span>{t('auth.easyTitle')}</span>
						<p>{t('auth.easyCopy')}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(Join);
