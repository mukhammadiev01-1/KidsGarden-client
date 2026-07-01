import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Typography } from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { userVar } from '../apollo/store';
import { getJwtToken, updateUserInfo } from '../libs/auth';
import MessagesPage from '../libs/components/chat/MessagesPage';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import PageSeo from '../libs/components/seo/PageSeo';

const sessionLoaderStyle: React.CSSProperties = {
	minHeight: 'calc(100vh - 120px)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	background: 'linear-gradient(180deg, #fffaf2 0%, #f5f9ef 100%)',
	paddingLeft: 16,
	paddingRight: 16,
};

const sessionLoaderInnerStyle: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: 12,
};

const sessionLoaderTextStyle: React.CSSProperties = {
	color: '#64746b',
	fontSize: 14,
};

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Messages: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);

	useEffect(() => {
		if (user?._id) return;

		const jwt = getJwtToken();
		if (jwt) {
			try {
				updateUserInfo(jwt);
				return;
			} catch {
				router.push('/account/login').then();
				return;
			}
		}

		router.push('/account/login').then();
	}, [router, user?._id]);

	if (!user?._id) {
		return (
			<div style={sessionLoaderStyle}>
				<div style={sessionLoaderInnerStyle}>
					<CircularProgress size={24} style={{ color: '#2f7d4a' }} />
					<Typography style={sessionLoaderTextStyle}>{t('messages.checkingSession')}</Typography>
				</div>
			</div>
		);
	}

	return (
		<>
			<PageSeo
				title={t('messages.seoTitle')}
				description={t('messages.seoDescription')}
				canonicalPath="/messages"
			/>
			<MessagesPage />
		</>
	);
};

export default withLayoutBasic(Messages);
