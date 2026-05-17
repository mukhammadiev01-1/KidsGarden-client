import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Stack, Tab, Typography, Button, Pagination } from '@mui/material';
import CommunityCard from '../../libs/components/common/CommunityCard';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const router = useRouter();
	const { query } = router;
	const articleCategory = query?.articleCategory as string;
	const categoryLabels: Record<string, string> = {
		FREE: 'Parent Board',
		NEWS: 'News',
		RECOMMEND: 'Kindergarten Updates',
		HUMOR: 'Community',
	};
	const visibleCategories = [BoardArticleCategory.FREE, BoardArticleCategory.NEWS];
	const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>(initialInput);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const { loading: getBoardArticlesLoading } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
		variables: { input: searchCommunity },
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotalCount(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => {
			setBoardArticles([]);
			setTotalCount(0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;
		if (!query?.articleCategory) {
			router.push(
				{
					pathname: router.pathname,
					query: { articleCategory: BoardArticleCategory.FREE },
				},
				router.pathname,
				{ shallow: true },
			);
			return;
		}

		const nextCategory = visibleCategories.includes(articleCategory as BoardArticleCategory)
			? (articleCategory as BoardArticleCategory)
			: BoardArticleCategory.FREE;

		if (nextCategory !== articleCategory) {
			router.replace(
				{
					pathname: router.pathname,
					query: { articleCategory: nextCategory },
				},
				router.pathname,
				{ shallow: true },
			);
			return;
		}

		setSearchCommunity((prev) => ({
			...prev,
			page: 1,
			search: { articleCategory: nextCategory },
		}));
	}, [router.isReady, articleCategory]);

	/** HANDLERS **/
	const tabChangeHandler = async (e: T, value: string) => {
		setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: value as BoardArticleCategory } });
		await router.push(
			{
				pathname: '/community',
				query: { articleCategory: value },
			},
			router.pathname,
			{ shallow: true },
		);
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const renderArticleList = () => {
		if (getBoardArticlesLoading) {
			return (
				<Stack className={'no-data'}>
					<p>Loading parent community posts...</p>
				</Stack>
			);
		}

		if (!totalCount) {
			const emptyMessage =
				searchCommunity.search.articleCategory === BoardArticleCategory.NEWS
					? 'Kindergarten news will appear here soon.'
					: 'Parent community posts will appear here soon.';

			return (
				<Stack className={'no-data'}>
					<img src="/img/icons/icoAlert.svg" alt="" />
					<p>{emptyMessage}</p>
				</Stack>
			);
		}

		return boardArticles?.map((boardArticle: BoardArticle) => {
			return <CommunityCard boardArticle={boardArticle} key={boardArticle?._id} />;
		});
	};

	return (
			<div id="community-list-page">
				<div className="container">
					<TabContext value={searchCommunity.search.articleCategory}>
						<Stack className="main-box">
							<Stack className="left-config">
									<Stack className={'image-info'}>
									<img src={'/img/logo/logoText.svg'} />
									<Stack className={'community-name'}>
										<Typography className={'name'}>Parent Community</Typography>
									</Stack>
								</Stack>

								<TabList
									orientation="vertical"
									aria-label="lab API tabs example"
									TabIndicatorProps={{
										style: { display: 'none' },
									}}
									onChange={tabChangeHandler}
								>
									{visibleCategories.map((category) => (
										<Tab
											value={category}
											label={categoryLabels[category]}
											className={`tab-button ${searchCommunity.search.articleCategory == category ? 'active' : ''}`}
											key={category}
										/>
									))}
								</TabList>
							</Stack>
							<Stack className="right-config">
								<Stack className="panel-config">
									<Stack className="title-box">
										<Stack className="left">
											<Typography className="title">
												{categoryLabels[searchCommunity.search.articleCategory] || 'Community'}
											</Typography>
											<Typography className="sub-title">
												Ask questions, share experiences, and read KidsGarden updates.
											</Typography>
										</Stack>
										<Button
											onClick={() =>
												router.push({
													pathname: '/mypage',
													query: {
														category: 'writeArticle',
													},
												})
											}
											className="right"
										>
											Write
										</Button>
									</Stack>

									{visibleCategories.map((category) => (
										<TabPanel value={category} key={category}>
											<Stack className="list-box">{renderArticleList()}</Stack>
										</TabPanel>
									))}
								</Stack>
							</Stack>
						</Stack>
					</TabContext>

					{totalCount > 0 && (
						<Stack className="pagination-config">
							<Stack className="pagination-box">
								<Pagination
									count={Math.ceil(totalCount / searchCommunity.limit)}
									page={searchCommunity.page}
									shape="circular"
									color="primary"
									onChange={paginationHandler}
								/>
							</Stack>
							<Stack className="total-result">
								<Typography>
									Total {totalCount} article{totalCount > 1 ? 's' : ''} available
								</Typography>
							</Stack>
						</Stack>
					)}
				</div>
			</div>
		);
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'ASC',
		search: {
			articleCategory: 'FREE',
		},
	},
};

export default withLayoutBasic(Community);
