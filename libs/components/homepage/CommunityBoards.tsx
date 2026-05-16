import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Box, Stack, Typography } from '@mui/material';
import CommunityCard from './CommunityCard';
import { BoardArticle } from '../../types/board-article/board-article';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { T } from '../../types/common';

const CommunityBoards = () => {
	const device = useDeviceDetect();
	const [searchCommunity, setSearchCommunity] = useState({
		page: 1,
		sort: 'articleViews',
		direction: 'DESC',
	});
	const [newsArticles, setNewsArticles] = useState<BoardArticle[]>([]);
	const [freeArticles, setFreeArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const { loading: getNewsArticlesLoading } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { ...searchCommunity, limit: 6, search: { articleCategory: BoardArticleCategory.NEWS } } },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setNewsArticles(data?.getBoardArticles?.list ?? []);
		},
	});

	const { loading: getFreeArticlesLoading } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { ...searchCommunity, limit: 3, search: { articleCategory: BoardArticleCategory.FREE } } },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setFreeArticles(data?.getBoardArticles?.list ?? []);
		},
	});

	const renderCommunityEmptyState = (message: string, showCta = false) => (
		<Box component={'div'} className={'homepage-empty-state community-empty-state'}>
			<p>{message}</p>
			{showCta && <Link href={'/community?articleCategory=FREE'}>Visit community</Link>}
		</Box>
	);

	if (device === 'mobile') {
		const mobileArticles = [...newsArticles.slice(0, 2), ...freeArticles.slice(0, 2)];

		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Typography variant={'h1'}>PARENT COMMUNITY HIGHLIGHTS</Typography>
					<Stack className={'community-main'}>
						{getNewsArticlesLoading || getFreeArticlesLoading ? (
							renderCommunityEmptyState('Loading community posts...')
						) : mobileArticles.length === 0 ? (
							renderCommunityEmptyState('Parent community posts will appear here soon.', true)
						) : (
							<Stack className={'card-wrap vertical'}>
								{mobileArticles.map((article, index) => {
									return <CommunityCard vertical={false} article={article} index={index} key={article?._id} />;
								})}
							</Stack>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Stack>
						<Typography variant={'h1'}>PARENT COMMUNITY HIGHLIGHTS</Typography>
					</Stack>
					<Stack className="community-main">
						<Stack className={'community-left'}>
							<Stack className={'content-top'}>
								<Link href={'/community?articleCategory=NEWS'}>
									<span>News</span>
								</Link>
								<img src="/img/icons/arrowBig.svg" alt="" />
							</Stack>
							<Stack className={'card-wrap'}>
								{getNewsArticlesLoading
									? renderCommunityEmptyState('Loading community posts...')
									: newsArticles.length === 0
									? renderCommunityEmptyState('Kindergarten news will appear here soon.')
									: newsArticles.map((article, index) => {
											return <CommunityCard vertical={true} article={article} index={index} key={article?._id} />;
									  })}
							</Stack>
						</Stack>
						<Stack className={'community-right'}>
							<Stack className={'content-top'}>
								<Link href={'/community?articleCategory=FREE'}>
									<span>Parent Board</span>
								</Link>
								<img src="/img/icons/arrowBig.svg" alt="" />
							</Stack>
							<Stack className={'card-wrap vertical'}>
								{getFreeArticlesLoading
									? renderCommunityEmptyState('Loading community posts...')
									: freeArticles.length === 0
									? renderCommunityEmptyState('Parent community posts will appear here soon.', true)
									: freeArticles.map((article, index) => {
											return <CommunityCard vertical={false} article={article} index={index} key={article?._id} />;
									  })}
							</Stack>
						</Stack>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default CommunityBoards;
