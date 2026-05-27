import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Button, Pagination, Stack, Typography } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { sweetLoginConfirmAlert } from '../../libs/sweetAlert';
import { REACT_APP_API_URL } from '../../libs/config';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type CommunityTopic = {
	key: string;
	label: string;
	category: BoardArticleCategory;
};

const topics: CommunityTopic[] = [
	{ key: 'all', label: 'All', category: BoardArticleCategory.FREE },
	{ key: 'parenting', label: 'Parenting Tips', category: BoardArticleCategory.FREE },
	{ key: 'learning', label: 'Learning & Development', category: BoardArticleCategory.FREE },
	{ key: 'health', label: 'Health & Nutrition', category: BoardArticleCategory.FREE },
	{ key: 'activities', label: 'Activities', category: BoardArticleCategory.FREE },
	{ key: 'qa', label: 'Q&A', category: BoardArticleCategory.FREE },
	{ key: 'news', label: 'Platform News', category: BoardArticleCategory.NEWS },
];

const categoryLabels: Record<string, string> = {
	FREE: 'Parenting Tips',
	NEWS: 'Platform News',
	RECOMMEND: 'Learning & Development',
	HUMOR: 'Activities',
};

const fallbackImages = [
	'/img/community/communityImg.png',
	'/img/community/articleImg.png',
	'/img/homepage/kidsgarden-hero-classroom.png',
];

const stripText = (content?: string, max = 118) => {
	const text = (content || '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!text) return 'Helpful ideas and safe community support for KidsGarden families.';
	return text.length > max ? `${text.slice(0, max).trim()}...` : text;
};

const formatDate = (date?: Date) => {
	if (!date) return 'Recently';
	return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));
};

const getArticleImage = (article: BoardArticle, index = 0) => {
	if (article?.articleImage) return `${REACT_APP_API_URL}/${article.articleImage}`;
	return fallbackImages[index % fallbackImages.length];
};

const getSafeAuthor = (article: BoardArticle) => {
	return article?.memberData?.memberFullName || article?.memberData?.memberNick || 'KidsGarden Team';
};

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const router = useRouter();
	const { query } = router;
	const user = useReactiveVar(userVar);
	const isParent = user.memberType === MemberType.PARENT;
	const isLoggedIn = Boolean(user?._id);
	const routeCategory = query?.articleCategory as string;

	const initialTopic = routeCategory === BoardArticleCategory.NEWS ? 'news' : 'all';
	const [activeTopic, setActiveTopic] = useState<string>(initialTopic);
	const [searchText, setSearchText] = useState<string>('');
	const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>(initialInput);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	const activeTopicConfig = useMemo(
		() => topics.find((topic) => topic.key === activeTopic) || topics[0],
		[activeTopic],
	);

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

	useEffect(() => {
		if (!router.isReady) return;
		const nextTopic = routeCategory === BoardArticleCategory.NEWS ? 'news' : 'all';
		const nextCategory = nextTopic === 'news' ? BoardArticleCategory.NEWS : BoardArticleCategory.FREE;

		setActiveTopic(nextTopic);
		setSearchCommunity((prev) => ({
			...prev,
			page: 1,
			search: {
				articleCategory: nextCategory,
			},
		}));
	}, [router.isReady, routeCategory]);

	const updateCommunitySearch = (topic: CommunityTopic, text = searchText, page = 1) => {
		setSearchCommunity((prev) => ({
			...prev,
			page,
			search: {
				articleCategory: topic.category,
				...(text.trim() ? { text: text.trim() } : {}),
			},
		}));
	};

	const topicChangeHandler = async (topic: CommunityTopic) => {
		setActiveTopic(topic.key);
		updateCommunitySearch(topic, searchText, 1);

		if (topic.category === BoardArticleCategory.NEWS || routeCategory === BoardArticleCategory.NEWS) {
			await router.push(
				{
					pathname: '/community',
					query: { articleCategory: topic.category },
				},
				router.pathname,
				{ shallow: true },
			);
		}
	};

	const searchChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchText(value);
		updateCommunitySearch(activeTopicConfig, value, 1);
	};

	const paginationHandler = (e: T, value: number) => {
		updateCommunitySearch(activeTopicConfig, searchText, value);
	};

	const writeButtonHandler = async () => {
		if (!isLoggedIn) {
			const confirmed = await sweetLoginConfirmAlert('Please login first');
			if (confirmed) await router.push('/account/join');
			return;
		}

		if (!isParent) return;
		await router.push({
			pathname: '/mypage',
			query: {
				category: 'writeArticle',
			},
		});
	};

	const openArticleHandler = (article: BoardArticle) => {
		router.push({
			pathname: '/community/detail',
			query: { articleCategory: article.articleCategory, id: article._id },
		});
	};

	const featuredArticles = boardArticles.slice(0, 3);
	const questionArticles = boardArticles.slice(3, 7);
	const hasArticles = totalCount > 0;

	const renderArticleCard = (article: BoardArticle, index: number) => (
		<button type="button" className="kg-community-card" key={article._id} onClick={() => openArticleHandler(article)}>
			<div className="kg-community-card-image">
				<img
					src={getArticleImage(article, index)}
					alt={article.articleTitle}
					onError={(event) => {
						const fallback = fallbackImages[index % fallbackImages.length];
						if (event.currentTarget.src.indexOf(fallback) === -1) event.currentTarget.src = fallback;
					}}
				/>
				<span>{categoryLabels[article.articleCategory] || 'Parenting Tips'}</span>
			</div>
			<div className="kg-community-card-body">
				<h3>{article.articleTitle}</h3>
				<p>{stripText(article.articleContent)}</p>
				<div className="kg-community-meta">
					<span>By {getSafeAuthor(article)}</span>
					<span>{formatDate(article.createdAt)}</span>
					<span><RemoveRedEyeIcon /> {article.articleViews || 0}</span>
					<span><ChatBubbleOutlineIcon /> {article.articleComments || 0}</span>
				</div>
			</div>
		</button>
	);

	const renderQuestionCard = (article: BoardArticle, index: number) => (
		<button type="button" className="kg-question-card" key={article._id} onClick={() => openArticleHandler(article)}>
			<span className="kg-question-icon">Q</span>
			<div>
				<h3>{article.articleTitle}</h3>
				<p>{article.articleComments || 0} answers · Asked by {getSafeAuthor(article)}</p>
			</div>
			<span className={`kg-question-status ${article.articleComments > 5 ? 'popular' : ''}`}>
				{article.articleComments > 5 ? 'Popular' : article.articleComments > 0 ? 'Answered' : 'New'}
			</span>
			<ArrowForwardIosIcon />
		</button>
	);

	return (
		<div id="community-list-page" className="kg-community-page">
			<style jsx global>{`
				#pc-wrap > .header-basic {
					display: none !important;
				}
			`}</style>
			<div className="container kg-community-container">
				<section className="kg-community-hero">
					<div>
						<Typography component="h1">Parent Community</Typography>
						<Typography className="kg-community-subtitle">
							Tips, ideas and support for your parenting journey.
						</Typography>
					</div>
					<Button onClick={writeButtonHandler} className="kg-write-button">
						<EditIcon />
						{isParent ? 'Write an Article' : isLoggedIn ? 'Parent accounts only' : 'Write an Article'}
					</Button>
				</section>

				<section className="kg-community-shell">
					<main className="kg-community-main">
						<div className="kg-community-search-row">
							<label className="kg-community-search">
								<input
									value={searchText}
									onChange={searchChangeHandler}
									placeholder="Search articles, questions, topics..."
								/>
								<SearchIcon />
							</label>
							<div className="kg-community-tabs">
								{topics.map((topic) => (
									<button
										type="button"
										key={topic.key}
										className={activeTopic === topic.key ? 'active' : ''}
										onClick={() => topicChangeHandler(topic)}
									>
										{topic.label}
									</button>
								))}
							</div>
						</div>

						<section className="kg-community-section">
							<div className="kg-community-section-title">
								<h2>Featured Articles</h2>
								<button type="button" onClick={() => topicChangeHandler(activeTopicConfig)}>View all</button>
							</div>
							{getBoardArticlesLoading && (
								<div className="kg-community-empty">Loading parent community articles...</div>
							)}
							{!getBoardArticlesLoading && !hasArticles && (
								<div className="kg-community-empty">
									{activeTopicConfig.category === BoardArticleCategory.NEWS
										? 'Platform news will appear here soon.'
										: 'Helpful parent articles and Q&A will appear here soon.'}
								</div>
							)}
							{!getBoardArticlesLoading && hasArticles && (
								<div className="kg-featured-grid">
									{featuredArticles.map((article, index) => renderArticleCard(article, index))}
								</div>
							)}
						</section>

						<section className="kg-community-lower-grid">
							<div className="kg-community-section kg-questions-section">
								<div className="kg-community-section-title">
									<h2>Recent Questions & Answers</h2>
									<button type="button" onClick={() => topicChangeHandler(topics.find((item) => item.key === 'qa') || topics[0])}>
										View all
									</button>
								</div>
								<div className="kg-question-list">
									{(questionArticles.length ? questionArticles : featuredArticles).map((article, index) =>
										renderQuestionCard(article, index),
									)}
									{!hasArticles && !getBoardArticlesLoading && (
										<div className="kg-community-empty compact">Questions from parents will appear here soon.</div>
									)}
								</div>
							</div>

							<div className="kg-community-section kg-highlights">
								<h2>Community Highlights</h2>
								<div className="kg-highlight-item">
									<ShieldOutlinedIcon />
									<div>
										<strong>A safe and respectful space</strong>
										<span>Keep conversations positive, kind and helpful for all parents.</span>
									</div>
								</div>
								<div className="kg-highlight-item">
									<TipsAndUpdatesOutlinedIcon />
									<div>
										<strong>Share experiences</strong>
										<span>Ask questions, share ideas and learn from other families.</span>
									</div>
								</div>
								<div className="kg-highlight-item">
									<FavoriteBorderIcon />
									<div>
										<strong>Focus on children</strong>
										<span>Support children's growth while protecting privacy.</span>
									</div>
								</div>
							</div>
						</section>

						{totalCount > 0 && (
							<Stack className="kg-community-pagination">
								<Pagination
									count={Math.ceil(totalCount / searchCommunity.limit)}
									page={searchCommunity.page}
									shape="circular"
									color="primary"
									onChange={paginationHandler}
								/>
								<Typography>
									Showing {totalCount} article{totalCount > 1 ? 's' : ''}
								</Typography>
							</Stack>
						)}
					</main>

					<aside className="kg-community-sidebar">
						<div className="kg-sidebar-card">
							<h2>Popular Topics</h2>
							<div className="kg-topic-list">
								<div><TipsAndUpdatesOutlinedIcon /><span>Positive Parenting</span><small>Parent posts</small></div>
								<div><MenuBookOutlinedIcon /><span>Child Development</span><small>Learning ideas</small></div>
								<div><RestaurantOutlinedIcon /><span>Health & Nutrition</span><small>Daily care</small></div>
								<div><ShieldOutlinedIcon /><span>Preparing for Kindergarten</span><small>Safe starts</small></div>
							</div>
						</div>

						<div className="kg-sidebar-card">
							<h2>Platform Updates</h2>
							<p>Read KidsGarden news, parent board updates and practical tips in one safe place.</p>
							<Button onClick={() => topicChangeHandler(topics.find((item) => item.key === 'news') || topics[0])}>
								See all updates
							</Button>
						</div>

						<div className="kg-sidebar-card kg-sidebar-cta">
							<h2>Community Guidelines</h2>
							<p>Share experiences, avoid private child data and keep every conversation respectful.</p>
							<Button onClick={writeButtonHandler}>Write Article</Button>
						</div>
					</aside>
				</section>

				<section className="kg-community-subscribe">
					<div>
						<h2>Stay inspired</h2>
						<p>Get parenting tips and platform updates from KidsGarden.</p>
					</div>
					<form>
						<input type="email" placeholder="Enter your email" />
						<button type="button">Subscribe</button>
					</form>
				</section>
			</div>
		</div>
	);
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			articleCategory: 'FREE',
		},
	},
};

export default withLayoutBasic(Community);
