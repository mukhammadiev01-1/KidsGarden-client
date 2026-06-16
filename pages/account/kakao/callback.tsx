import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Button, Stack } from '@mui/material';
import withLayoutBasic from '../../../libs/components/layout/LayoutBasic';
import { KakaoAuthIntent, kakaoLogIn } from '../../../libs/auth';
import { KAKAO_REDIRECT_URI } from '../../../libs/config';
import { sweetMixinErrorAlert } from '../../../libs/sweetAlert';

const KakaoCallback: NextPage = () => {
	const router = useRouter();
	const [message, setMessage] = useState('Completing Kakao login...');
	const submittedRef = useRef(false);

	useEffect(() => {
		if (!router.isReady) return;
		if (submittedRef.current) return;

		const completeKakaoLogin = async () => {
			submittedRef.current = true;
			const error = Array.isArray(router.query.error) ? router.query.error[0] : router.query.error;
			const code = Array.isArray(router.query.code) ? router.query.code[0] : router.query.code;
			const state = Array.isArray(router.query.state) ? router.query.state[0] : router.query.state;
			const expectedState = window.sessionStorage.getItem('kakao_oauth_state');
			const intent = window.sessionStorage.getItem('kakao_oauth_intent') as KakaoAuthIntent | null;
			const referrer = window.sessionStorage.getItem('kakao_oauth_referrer') || '/';

			try {
				if (error) throw new Error(`Kakao login failed: ${error}`);
				if (!code) throw new Error('Kakao login did not return an authorization code');
				if (!state || !expectedState || state !== expectedState) throw new Error('Invalid Kakao login state');
				if (intent !== 'LOGIN' && intent !== 'SIGNUP') throw new Error('Invalid Kakao login intent');
				if (!KAKAO_REDIRECT_URI) throw new Error('Kakao login is not configured');

				await kakaoLogIn(code, KAKAO_REDIRECT_URI, intent);
				window.sessionStorage.removeItem('kakao_oauth_state');
				window.sessionStorage.removeItem('kakao_oauth_intent');
				window.sessionStorage.removeItem('kakao_oauth_referrer');
				await router.replace(referrer);
			} catch (err: any) {
				window.sessionStorage.removeItem('kakao_oauth_state');
				window.sessionStorage.removeItem('kakao_oauth_intent');
				window.sessionStorage.removeItem('kakao_oauth_referrer');
				const errorMessage = err.message || 'Kakao login failed';
				setMessage(errorMessage);
				await sweetMixinErrorAlert(errorMessage);
				const target = errorMessage.includes('Please sign up first') ? '/account/join?mode=register' : '/account/join';
				await router.replace(target);
			}
		};

		completeKakaoLogin();
	}, [router]);

	return (
		<Stack className={'join-page'}>
			<Stack className={'container'}>
				<Stack className={'main'}>
					<Stack className={'left'}>
						<div className={'logo'}>
							<img src="/img/logo/logoText.svg" alt="" />
							<span>KidsGarden</span>
						</div>
						<div className={'info'}>
							<span>Kakao Login</span>
							<p>{message}</p>
						</div>
						<Button variant="outlined" onClick={() => router.push('/account/join')}>
							Back to login
						</Button>
					</Stack>
					<Stack className={'right'}></Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(KakaoCallback);
