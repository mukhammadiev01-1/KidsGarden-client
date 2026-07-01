import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { BoardArticle } from '../../types/board-article/board-article';
import { T } from '../../types/common';
import { getArticleExcerpt } from '../../utils/articleExcerpt';
import { useTranslation } from 'next-i18next';

const MyArticles: NextPage = ({ initialInput, ...props }: T) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { data, loading, error } = useQuery(GET_BOARD_ARTICLES, {
		skip: !user?._id,
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				...initialInput,
				search: {
					articleCategory: BoardArticleCategory.FREE,
					memberId: user?._id,
				},
			},
		},
	});

	const articles: BoardArticle[] = data?.getBoardArticles?.list ?? [];

	return (
		<div id="my-articles-page">
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">{t('myPosts.title')}</Typography>
					<Typography className="sub-title">
						{t('myPosts.subtitle')}
					</Typography>
				</Stack>
			</Stack>
			<Stack className="article-list-box" gap={2}>
				{loading && (
					<div className={'no-data coming-soon-state'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>{t('myPosts.loading')}</p>
					</div>
				)}

				{!loading && error && (
					<div className={'no-data coming-soon-state'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>{t('myPosts.loadError')}</p>
						<span>{t('myPosts.tryCommunity')}</span>
					</div>
				)}

				{!loading && !error && articles.length === 0 && (
					<div className={'no-data coming-soon-state'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>{t('myPosts.emptyTitle')}</p>
						<span>{t('myPosts.emptyText')}</span>
						<Link href="/mypage?category=writeArticle">
							<Button variant="contained" sx={{ mt: 2, background: '#2f7d4a', textTransform: 'none' }}>
								{t('myPosts.writeArticle')}
							</Button>
						</Link>
					</div>
				)}

				{!loading &&
					!error &&
					articles.map((article) => (
						<Stack
							key={article._id}
							sx={{
								border: '1px solid #e4efe7',
								borderRadius: '16px',
								background: '#fff',
								boxShadow: '0 12px 32px rgba(47, 74, 59, 0.08)',
								p: { xs: 2, md: 2.5 },
								gap: 1.25,
							}}
						>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
								<Stack gap={0.75} sx={{ minWidth: 0 }}>
									<Typography sx={{ color: '#24332d', fontWeight: 800, fontSize: '17px' }}>
										{article.articleTitle}
									</Typography>
									<Typography sx={{ color: '#64746b', fontSize: '14px', lineHeight: 1.45 }}>
										{getArticleExcerpt(article.articleContent, 150)}
									</Typography>
								</Stack>
								<Link
									href={`/community/detail?articleCategory=${article.articleCategory}&id=${article._id}`}
									style={{ textDecoration: 'none', alignSelf: 'flex-start' }}
								>
									<Button
										variant="outlined"
										sx={{
											borderColor: '#b9dfc3',
											color: '#2f7d4a',
											borderRadius: '999px',
											textTransform: 'none',
											fontWeight: 800,
											whiteSpace: 'nowrap',
										}}
									>
										{t('myPosts.openEdit')}
									</Button>
								</Link>
							</Stack>
							<Stack direction="row" gap={2} flexWrap="wrap" sx={{ color: '#7d8d84', fontSize: '12px' }}>
								<span>{new Date(article.createdAt).toLocaleDateString()}</span>
								<span>
									<VisibilityOutlinedIcon sx={{ width: 14, height: 14, verticalAlign: 'middle', mr: 0.4 }} />
									{article.articleViews || 0}
								</span>
								<span>
									<FavoriteBorderRoundedIcon sx={{ width: 14, height: 14, verticalAlign: 'middle', mr: 0.4 }} />
									{article.articleLikes || 0}
								</span>
								<span>
									<ChatBubbleOutlineRoundedIcon sx={{ width: 14, height: 14, verticalAlign: 'middle', mr: 0.4 }} />
									{article.articleComments || 0}
								</span>
							</Stack>
						</Stack>
					))}
			</Stack>
		</div>
	);
};

MyArticles.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	},
};

export default MyArticles;
