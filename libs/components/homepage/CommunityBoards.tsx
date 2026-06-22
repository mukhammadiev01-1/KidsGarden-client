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
		sort: 'createdAt',
		direction: 'DESC',
	});
	const [newsArticles, setNewsArticles] = useState<BoardArticle[]>([]);
	const [freeArticles, setFreeArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const { loading: getNewsArticlesLoading } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { ...searchCommunity, limit: 3, search: { articleCategory: BoardArticleCategory.NEWS } } },
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

	const latestNewsArticles = newsArticles.slice(0, 3);
	const latestFreeArticles = freeArticles.slice(0, 3);

	if (device === 'mobile') {
		const mobileArticles = [...latestNewsArticles.slice(0, 2), ...latestFreeArticles.slice(0, 2)];

		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Typography variant={'h1'}>Parent Community Highlights</Typography>
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
		const hasCommunityArticles = latestNewsArticles.length > 0 || latestFreeArticles.length > 0;

		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Stack>
						<Typography variant={'h1'}>Parent Community Highlights</Typography>
						<Typography className={'community-section-copy'}>
							Helpful updates and parent conversations from the KidsGarden community.
						</Typography>
					</Stack>
					{getNewsArticlesLoading || getFreeArticlesLoading || !hasCommunityArticles ? (
						<Box component={'div'} className={'community-empty-panel'}>
							<span>Community updates</span>
							<h3>
								{getNewsArticlesLoading || getFreeArticlesLoading
									? 'Loading community highlights...'
									: 'Parent community posts will appear here soon.'}
							</h3>
							<p>
								News, center updates, and parent conversations will show here once posts are available.
							</p>
							<Link href={'/community?articleCategory=FREE'}>Visit community</Link>
						</Box>
					) : (
						<Stack className="community-main">
							<Stack className={'community-left'}>
								<Link className={'content-top'} href={'/community?articleCategory=NEWS'}>
									<span>News</span>
									<img src="/img/icons/arrowBig.svg" alt="" aria-hidden="true" />
								</Link>
								<Stack className={'card-wrap'}>
									{newsArticles.length === 0
										? renderCommunityEmptyState('Kindergarten news will appear here soon.')
										: latestNewsArticles.map((article, index) => {
												return <CommunityCard vertical={true} article={article} index={index} key={article?._id} />;
										  })}
								</Stack>
							</Stack>
							<Stack className={'community-right'}>
								<Link className={'content-top'} href={'/community?articleCategory=FREE'}>
									<span>Parent Board</span>
									<img src="/img/icons/arrowBig.svg" alt="" aria-hidden="true" />
								</Link>
								<Stack className={'card-wrap vertical'}>
									{freeArticles.length === 0
										? renderCommunityEmptyState('Parent community posts will appear here soon.', true)
										: latestFreeArticles.map((article, index) => {
												return <CommunityCard vertical={false} article={article} index={index} key={article?._id} />;
										  })}
								</Stack>
							</Stack>
						</Stack>
					)}
				</Stack>
			</Stack>
		);
	}
};

export default CommunityBoards;
