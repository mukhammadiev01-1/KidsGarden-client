import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const RecentlyVisited: NextPage = () => {
	const { t } = useTranslation('common');
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/

	/** HANDLERS **/

	if (device === 'mobile') {
		return <div>{t('mypageText.RecentlyVisited.mobileNotice')}</div>;
	} else {
		return (
			<div id="my-favorites-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">{t('mypage.menu.recentlyVisited')}</Typography>
						<Typography className="sub-title">{t('mypageText.RecentlyVisited.subtitle')}</Typography>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					<div className={'no-data coming-soon-state'}>
						<img loading="lazy" src="/img/icons/icoAlert.svg" alt="" />
						<p>{t('mypageText.RecentlyVisited.comingSoon')}</p>
						<span>{t('mypageText.RecentlyVisited.comingSoonHint')}</span>
					</div>
				</Stack>
			</div>
		);
	}
};

export default RecentlyVisited;
