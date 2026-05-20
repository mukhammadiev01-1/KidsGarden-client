import React from 'react';
import { NextPage } from 'next';
import { Button, Stack, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { useRouter } from 'next/router';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const isParent = user.memberType === MemberType.PARENT;

	if (!isParent) {
		return (
			<div id="write-article-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Parent Board</Typography>
						<Typography className="sub-title">
							Parent Board posting is available only for parent accounts in this MVP.
						</Typography>
						<Button variant="contained" onClick={() => router.push('/community?articleCategory=FREE')}>
							Back to Community
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
					<Typography className="main-title">Write a Parent Board post</Typography>
					<Typography className="sub-title">
						Share a question, experience, or helpful tip with other parents.
					</Typography>
				</Stack>
			</Stack>
			<TuiEditor />
		</div>
	);
};

export default WriteArticle;
