import React from 'react';
import { NextPage } from 'next';
import { Button, Stack, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const isParent = user.memberType === MemberType.PARENT;

	if (!isParent) {
		return (
			<div id="write-article-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">{t('myPosts.parentBoard')}</Typography>
						<Typography className="sub-title">
							{t('myPosts.parentOnly')}
						</Typography>
						<Button variant="contained" onClick={() => router.push('/community?articleCategory=FREE')}>
							{t('myPosts.backToCommunity')}
						</Button>
					</Stack>
				</Stack>
			</div>
		);
	}

	return (
		<div id="write-article-page">
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">{t('myPosts.writeTitle')}</Typography>
					<Typography className="sub-title">
						{t('myPosts.writeSubtitle')}
					</Typography>
				</Stack>
			</Stack>
			<TuiEditor />
		</div>
	);
};

export default WriteArticle;
