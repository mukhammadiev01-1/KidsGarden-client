import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { gql } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { initializeApollo } from '../../apollo/client';
import { getJwtToken } from '../../libs/auth';

// The only place this page ever sends a login code. Not taken from the URL:
// a crafted link must not be able to deliver a code to another app or site.
const APP_RETURN_URL = 'kidsgarden://auth';
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const CREATE_APP_LOGIN_CODE = gql`
	mutation CreateAppLoginCode($input: AppLoginCodeInput!) {
		createAppLoginCode(input: $input)
	}
`;

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/**
 * Last step of signing in to the mobile app with a social account.
 *
 * The app opens /account/join?referrer=/account/app-return?c=<challenge> in the
 * phone's in-app browser. After any successful login the join page lands here;
 * this page asks the API for a one-time code tied to the app's challenge and
 * returns to the app with it. The app exchanges the code for its own session.
 */
const AppReturn: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [returnUrl, setReturnUrl] = useState('');
	const [failed, setFailed] = useState(false);
	const startedRef = useRef(false);

	useEffect(() => {
		if (!router.isReady || startedRef.current) return;
		startedRef.current = true;

		const raw = router.query.c;
		const challenge = Array.isArray(raw) ? raw[0] : raw;
		if (!challenge || !CHALLENGE_PATTERN.test(challenge)) {
			setFailed(true);
			return;
		}

		// Not signed in on the website yet: go through the normal login first.
		if (!getJwtToken()) {
			const self = `/account/app-return?c=${challenge}`;
			router.replace(`/account/join?referrer=${encodeURIComponent(self)}`).catch(() => undefined);
			return;
		}

		(async () => {
			try {
				const apolloClient = await initializeApollo();
				const result = await apolloClient.mutate({
					mutation: CREATE_APP_LOGIN_CODE,
					variables: { input: { challenge } },
					fetchPolicy: 'network-only',
				});
				const code = result?.data?.createAppLoginCode;
				if (!code) throw new Error('No code returned');

				const url = `${APP_RETURN_URL}?code=${encodeURIComponent(code)}`;
				setReturnUrl(url);
				window.location.replace(url);
			} catch (err) {
				console.warn('app login hand-off failed', err);
				setFailed(true);
			}
		})();
	}, [router]);

	return (
		<main className={'app-return'}>
			<img src="/img/logo/kidsgarden-mark.svg" alt="" width={56} height={56} />
			<h1>KidsGarden</h1>
			{failed ? (
				<p role="alert">{t('auth.appReturnFailed')}</p>
			) : (
				<>
					<p>{t('auth.appReturnMessage')}</p>
					{returnUrl ? (
						<a href={returnUrl} className={'app-return-button'}>
							{t('auth.appReturnButton')}
						</a>
					) : null}
				</>
			)}
			<style jsx>{`
				.app-return {
					min-height: 100vh;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 12px;
					padding: 24px;
					text-align: center;
					background: #fff9ed;
					color: #24332d;
				}
				.app-return h1 {
					font-size: 22px;
					font-weight: 700;
				}
				.app-return p {
					max-width: 320px;
					font-size: 15px;
					line-height: 1.5;
				}
				.app-return-button {
					margin-top: 8px;
					padding: 12px 24px;
					border-radius: 12px;
					background: #4f7c5b;
					color: #ffffff;
					font-weight: 600;
					text-decoration: none;
				}
			`}</style>
		</main>
	);
};

export default AppReturn;
