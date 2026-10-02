import React from 'react';
import { Stack, Box } from '@mui/material';
import { useTranslation } from 'next-i18next';

const Notice = () => {
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	const data = [
		{
			no: 1,
			event: true,
			title: t('csPage.Notice.welcomeTitle'),
			date: '01.03.2024',
		},
		{
			no: 2,
			title: t('csPage.Notice.communityTitle'),
			date: '31.03.2024',
		},
	];

	return (
		<Stack className={'notice-content'}>
			<span className={'title'}>{t('admin.menu.notices')}</span>
			<Stack className={'main'}>
				<Box component={'div'} className={'top'}>
					<span>{t('csPage.Notice.columnNumber')}</span>
					<span>{t('csPage.Notice.columnTitle')}</span>
					<span>{t('csPage.Notice.columnDate')}</span>
				</Box>
				<Stack className={'bottom'}>
					{data.map((ele: any) => (
						<div className={`notice-card ${ele?.event && 'event'}`} key={ele.no}>
							{ele?.event ? (
								<div>{t('csPage.Notice.badge')}</div>
							) : (
								<span className={'notice-number'}>{ele.no}</span>
							)}
							<span className={'notice-title'}>{ele.title}</span>
							<span className={'notice-date'}>{ele.date}</span>
						</div>
					))}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Notice;
