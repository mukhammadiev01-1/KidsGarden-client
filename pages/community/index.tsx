import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Pagination, Stack, Typography } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { getImageUrl } from '../../libs/config';
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
import { getArticleExcerpt } from '../../libs/utils/articleExcerpt';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type CommunityTopic = {
	key: string;
	labelKey: string;
	category: BoardArticleCategory;
};

const topics: CommunityTopic[] = [
	{ key: 'free', labelKey: 'community.topics.free', category: BoardArticleCategory.FREE },
	{ key: 'news', labelKey: 'community.topics.news', category: BoardArticleCategory.NEWS },
];

const fallbackImages = [
	'/img/kidsgarden/articles/article-play-based-learning.png',
	'/img/kidsgarden/articles/article-parent-teacher-communication.png',
	'/img/kidsgarden/articles/article-first-day-kindergarten.png',
];

const formatDate = (date?: Date, locale = 'en', fallback = 'Recently') => {
	if (!date) return fallback;
	const dateLocale = locale === 'kr' ? 'ko' : locale;
	return new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric' }).format(new Date(date));
};

const getArticleImage = (article: BoardArticle, index = 0) => {
	const rawImage = Array.isArray((article as any)?.articleImage)
		? (article as any).articleImage[0]
		: article?.articleImage;

	return getImageUrl(rawImage, fallbackImages[index % fallbackImages.length]);
};

const getCommunityHref = (category: BoardArticleCategory) => ({
	pathname: '/community',
	query: { articleCategory: category },
});

const getSafeAuthor = (article: BoardArticle, fallbackAuthor: string) => {
	return article?.memberData?.memberFullName || article?.memberData?.memberNick || fallbackAuthor;
};

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { query } = router;
	const locale = router.locale || 'en';
	const user = useReactiveVar(userVar);
	const isLoggedIn = Boolean(user?._id);
	const routeCategory = query?.articleCategory as string;

	const initialTopic = routeCategory === BoardArticleCategory.NEWS ? 'news' : 'free';
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
		const nextTopic = routeCategory === BoardArticleCategory.NEWS ? 'news' : 'free';
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

	const searchChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchText(value);
		updateCommunitySearch(activeTopicConfig, value, 1);
	};

	const paginationHandler = (e: T, value: number) => {
		updateCommunitySearch(activeTopicConfig, searchText, value);
	};

	const writeArticleHref = isLoggedIn
		? { pathname: '/mypage', query: { category: 'writeArticle' } }
		: { pathname: '/account/join', query: { mode: 'login' } };

	const openArticleHandler = (article: BoardArticle) => {
		router.push({
			pathname: '/community/detail',
			query: { articleCategory: article.articleCategory, id: article._id },
		});
	};

	const featuredArticles = boardArticles.slice(0, 3);
	const secondaryArticles = boardArticles.slice(3, 7);
	const hasArticles = totalCount > 0;
	const isNewsTopic = activeTopicConfig.category === BoardArticleCategory.NEWS;

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
				<span>{t(`community.categories.${article.articleCategory}`, t('community.categories.fallback'))}</span>
			</div>
			<div className="kg-community-card-body">
				<h3>{article.articleTitle}</h3>
				<p>{getArticleExcerpt(article.articleContent)}</p>
				<div className="kg-community-meta">
					<span>{t('community.meta.by')} {getSafeAuthor(article, t('community.teamAuthor'))}</span>
					<span>{formatDate(article.createdAt, locale, t('community.meta.recently'))}</span>
					<span>
						<RemoveRedEyeIcon /> {article.articleViews || 0}
					</span>
					<span>
						<ChatBubbleOutlineIcon /> {article.articleComments || 0}
					</span>
				</div>
			</div>
		</button>
	);

	const renderQuestionCard = (article: BoardArticle, index: number) => (
		<button type="button" className="kg-question-card" key={article._id} onClick={() => openArticleHandler(article)}>
			<span className="kg-question-icon">{article.articleCategory === BoardArticleCategory.NEWS ? 'N' : 'P'}</span>
			<div>
				<h3>{article.articleTitle}</h3>
				<p>
					{article.articleComments || 0} {t('community.meta.comments')} · {t('community.meta.by')} {getSafeAuthor(article, t('community.teamAuthor'))}
				</p>
			</div>
			<span className={`kg-question-status ${article.articleComments > 5 ? 'popular' : ''}`}>
				{article.articleCategory === BoardArticleCategory.NEWS
					? t('community.status.news')
					: article.articleComments > 5
					? t('community.status.popular')
					: article.articleComments > 0
					? t('community.status.active')
					: t('community.status.new')}
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
						<Typography component="h1">{t('community.heroTitle')}</Typography>
						<Typography className="kg-community-subtitle">
							{t('community.heroSubtitle')}
						</Typography>
					</div>
					<Link href={writeArticleHref} className="kg-write-button">
						<EditIcon />
						{t('community.writeArticle')}
					</Link>
				</section>

				<section className="kg-community-shell">
					<main className="kg-community-main">
						<div className="kg-community-search-row">
							<label className="kg-community-search">
								<input
									value={searchText}
									onChange={searchChangeHandler}
									placeholder={t('community.searchPlaceholder')}
								/>
								<SearchIcon />
							</label>
							<div className="kg-community-tabs">
								{topics.map((topic) => (
									<Link
										href={getCommunityHref(topic.category)}
										key={topic.key}
										className={activeTopic === topic.key ? 'active' : ''}
									>
										{t(topic.labelKey)}
									</Link>
								))}
							</div>
						</div>

						<section className="kg-community-section">
							<div className="kg-community-section-title">
								<h2>{isNewsTopic ? t('community.latestNews') : t('community.parentBoardPosts')}</h2>
								<Link href={getCommunityHref(activeTopicConfig.category)}>
									{t('community.viewAll')}
								</Link>
							</div>
							{getBoardArticlesLoading && (
								<div className="kg-community-empty">{t('community.loadingArticles')}</div>
							)}
							{!getBoardArticlesLoading && !hasArticles && (
								<div className="kg-community-empty">
									{activeTopicConfig.category === BoardArticleCategory.NEWS
										? t('community.newsSoon')
										: t('community.parentPostsSoon')}
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
									<h2>{isNewsTopic ? t('community.moreNews') : t('community.recentParentActivity')}</h2>
									<Link href={getCommunityHref(activeTopicConfig.category)}>
										{t('community.viewAll')}
									</Link>
								</div>
								<div className="kg-question-list">
									{(secondaryArticles.length ? secondaryArticles : featuredArticles).map((article, index) =>
										renderQuestionCard(article, index),
									)}
									{!hasArticles && !getBoardArticlesLoading && (
										<div className="kg-community-empty compact">
											{isNewsTopic ? t('community.moreNewsSoon') : t('community.postsSoon')}
										</div>
									)}
								</div>
							</div>

							<div className="kg-community-section kg-highlights">
								<h2>{t('community.highlightsTitle')}</h2>
								<div className="kg-highlight-item">
									<ShieldOutlinedIcon />
									<div>
										<strong>{t('community.safeTitle')}</strong>
										<span>{t('community.safeText')}</span>
									</div>
								</div>
								<div className="kg-highlight-item">
									<TipsAndUpdatesOutlinedIcon />
									<div>
										<strong>{t('community.shareTitle')}</strong>
										<span>{t('community.shareText')}</span>
									</div>
								</div>
								<div className="kg-highlight-item">
									<FavoriteBorderIcon />
									<div>
										<strong>{t('community.childrenTitle')}</strong>
										<span>{t('community.childrenText')}</span>
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
							<h2>{t('community.popularTopics')}</h2>
							<div className="kg-topic-list">
								<div>
									<TipsAndUpdatesOutlinedIcon />
									<span>{t('community.positiveParenting')}</span>
									<small>{t('community.parentPosts')}</small>
								</div>
								<div>
									<MenuBookOutlinedIcon />
									<span>{t('community.childDevelopment')}</span>
									<small>{t('community.learningIdeas')}</small>
								</div>
								<div>
									<RestaurantOutlinedIcon />
									<span>{t('community.healthNutrition')}</span>
									<small>{t('community.dailyCare')}</small>
								</div>
								<div>
									<ShieldOutlinedIcon />
									<span>{t('community.preparingKindergarten')}</span>
									<small>{t('community.safeStarts')}</small>
								</div>
							</div>
						</div>

						<div className="kg-sidebar-card">
							<h2>{t('community.platformUpdates')}</h2>
							<p>{t('community.platformUpdatesText')}</p>
							<Link href={getCommunityHref(BoardArticleCategory.NEWS)}>
								{t('community.seeAllUpdates')}
							</Link>
						</div>

						<div className="kg-sidebar-card kg-sidebar-cta">
							<h2>{t('community.guidelines')}</h2>
							<p>{t('community.guidelinesText')}</p>
							<Link href={writeArticleHref}>{t('community.writeArticle')}</Link>
						</div>
					</aside>
				</section>

				<section className="kg-community-subscribe">
					<div>
						<h2>{t('community.stayInspired')}</h2>
						<p>{t('community.subscribeText')}</p>
					</div>
					<form>
						<input type="email" placeholder={t('community.emailPlaceholder')} />
						<button type="button" disabled title={t('community.emailComingSoon')}>
							{t('community.comingSoon')}
						</button>
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
