import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const withLayoutBasic = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const { t } = useTranslation('common');
		const device = useDeviceDetect();
		const [authHeader, setAuthHeader] = useState<boolean>(false);
		const user = useReactiveVar(userVar);

		const memoizedValues = useMemo(() => {
			let title = '',
				desc = '',
				bgImage = '';

			switch (router.pathname) {
				case '/property':
					title = 'Find Kindergartens';
					desc = 'Browse trusted centers for your family.';
					bgImage = '/img/banner/properties.png';
					break;
				case '/agent':
					title = 'KidsGarden';
					desc = 'Home';
					bgImage = '/img/banner/agents.webp';
					break;
				case '/agent/detail':
					title = 'KidsGarden';
					desc = 'Home';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/mypage':
					title = 'My Page';
					desc = 'Your KidsGarden dashboard.';
					bgImage = '/img/banner/header1.svg';
					break;
				case '/community':
					title = 'Community';
					desc = 'Parent stories, questions, and kindergarten news.';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/community/detail':
					title = 'Community Article';
					desc = 'Parent stories, questions, and kindergarten news.';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/cs':
					title = 'Help Center';
					desc = 'Find answers and notices for KidsGarden families.';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/account/join':
					title = 'Login / Join';
					desc = 'Access your KidsGarden account.';
					bgImage = '/img/banner/header2.svg';
					setAuthHeader(true);
					break;
				case '/member':
					title = 'Member Profile';
					desc = 'KidsGarden community profile.';
					bgImage = '/img/banner/header1.svg';
					break;
				default:
					break;
			}

			return { title, desc, bgImage };
		}, [router.pathname]);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		/** HANDLERS **/

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>KidsGarden</title>
						<meta name={'title'} content={`KidsGarden`} />
					</Head>
					<Stack id="mobile-wrap">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		} else {
			return (
				<>
					<Head>
						<title>KidsGarden</title>
						<meta name={'title'} content={`KidsGarden`} />
					</Head>
					<Stack id="pc-wrap">
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack
							className={`header-basic ${authHeader && 'auth'}`}
							style={{
								backgroundImage: `url(${memoizedValues.bgImage})`,
								backgroundSize: 'cover',
								boxShadow: 'inset 0 0 0 1000px rgba(36, 51, 45, 0.58)',
							}}
						>
							<Stack className={'container'}>
								<strong>{t(memoizedValues.title)}</strong>
								<span>{t(memoizedValues.desc)}</span>
							</Stack>
						</Stack>

						<Stack id={'main'}>
							<Component {...props} />
						</Stack>

						{user?._id && <Chat />}

						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}
	};
};

export default withLayoutBasic;
