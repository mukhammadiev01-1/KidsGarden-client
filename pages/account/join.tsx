import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { googleLogIn, logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MemberType } from '../../libs/enums/member.enum';
import { GoogleLogin } from '@react-oauth/google';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Join: NextPage = () => {
	const router = useRouter();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: MemberType.PARENT });
	const [loginView, setLoginView] = useState<boolean>(true);
	const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
