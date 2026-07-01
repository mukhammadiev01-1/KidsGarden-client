import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Box, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import CommunityCard from './CommunityCard';
import { BoardArticle } from '../../types/board-article/board-article';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { T } from '../../types/common';
import { useTranslation } from 'next-i18next';
import { getImageUrl } from '../../config';
import { getArticleExcerpt } from '../../utils/articleExcerpt';
import Moment from 'react-moment';

const ARTICLE_IMAGE_FALLBACK = '/img/kidsgarden/articles/article-play-based-learning.png';
type CommunityHighlightTab = 'all' | 'parentTips' | 'dailyLife' | 'questions';

const getArticleImage = (article: BoardArticle): string => {
	const rawImage = Array.isArray((article as any)?.articleImage)
		? (article as any).articleImage[0]
		: article?.articleImage;

	return getImageUrl(rawImage, ARTICLE_IMAGE_FALLBACK);
};

const CommunityBoards = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const [activeTab, setActiveTab] = useState<CommunityHighlightTab>('all');
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
			{showCta && <Link href={'/community?articleCategory=FREE'}>{t('home.visitCommunity')}</Link>}
		</Box>
	);

	const latestNewsArticles = newsArticles.slice(0, 3);
	const latestFreeArticles = freeArticles.slice(0, 3);
	const categoryLabels: Record<string, string> = {
		FREE: 'Parent Tips',
		NEWS: 'Daily Life',
		RECOMMEND: t('home.articleCategory.recommend'),
		HUMOR: t('home.articleCategory.humor'),
	};
	const highlightArticles = [
		...latestFreeArticles.slice(0, 1),
		...latestNewsArticles.slice(0, 1),
		...latestFreeArticles.slice(1),
		...latestNewsArticles.slice(1),
	]
		.filter((article, index, articles) => article?._id && articles.findIndex((item) => item?._id === article?._id) === index)
		.slice(0, 3);
	const tabDefinitions: Array<{
		key: CommunityHighlightTab;
		label: string;
		icon: typeof FavoriteBorderRoundedIcon;
	}> = [
		{ key: 'all', label: 'All Posts', icon: FavoriteBorderRoundedIcon },
		{ key: 'parentTips', label: 'Parent Tips', icon: FavoriteBorderRoundedIcon },
		{ key: 'dailyLife', label: 'Daily Life', icon: LocalFloristRoundedIcon },
		{ key: 'questions', label: 'Questions', icon: HelpOutlineRoundedIcon },
	];

	const getArticleTab = (article: BoardArticle): CommunityHighlightTab => {
		if (article?.articleCategory === BoardArticleCategory.NEWS) return 'dailyLife';
		if (article?.articleCategory === BoardArticleCategory.HUMOR) return 'questions';
		return 'parentTips';
	};

	const visibleHighlightArticles =
		activeTab === 'all' ? highlightArticles : highlightArticles.filter((article) => getArticleTab(article) === activeTab);

	const getAuthorName = (article: BoardArticle, fallbackIndex: number): string => {
		return article?.memberData?.memberFullName || article?.memberData?.memberNick || `KidsGarden Parent ${String.fromCharCode(65 + fallbackIndex)}`;
	};

	const getAuthorInitial = (article: BoardArticle, fallbackIndex: number): string => {
		return getAuthorName(article, fallbackIndex).trim().charAt(0).toUpperCase() || 'P';
	};

	const renderCommunityHighlightCard = (article: BoardArticle, index: number) => {
		const authorImage = article?.memberData?.memberImage ? getImageUrl(article.memberData.memberImage) : '';
		const badgeLabels = ['TOP DISCUSSION', 'POPULAR', 'NEW'];
		const categoryLabel = categoryLabels[article?.articleCategory] || t('home.articleCategory.community');

		return (
			<Link
				className={'community-highlight-card'}
				href={`/community/detail?articleCategory=${article?.articleCategory}&id=${article?._id}`}
				key={article?._id}
			>
				<div className={'community-highlight-image'} style={{ backgroundImage: `url(${getArticleImage(article)})` }}>
					<span className={`community-highlight-badge badge-${index}`}>{badgeLabels[index] || categoryLabel}</span>
				</div>
				<div className={'community-highlight-body'}>
					<span className={'community-highlight-category'}>{categoryLabel}</span>
					<strong>{article?.articleTitle}</strong>
					<p>{getArticleExcerpt(article?.articleContent, 112)}</p>
					<div className={'community-highlight-meta'}>
						<div className={'community-author'}>
							{authorImage ? (
								<img src={authorImage} alt={getAuthorName(article, index)} />
							) : (
								<span>{getAuthorInitial(article, index)}</span>
							)}
							<div>
								<b>{getAuthorName(article, index)}</b>
								<small>
									<Moment fromNow>{article?.createdAt}</Moment>
								</small>
							</div>
						</div>
						<div className={'community-stats'}>
							{typeof article?.articleLikes === 'number' && (
								<span>
									<FavoriteBorderRoundedIcon />
									{article.articleLikes}
								</span>
							)}
							{typeof article?.articleComments === 'number' && (
								<span>
									<ChatBubbleOutlineRoundedIcon />
									{article.articleComments}
								</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		);
	};

	const benefits = [
		{ icon: SecurityRoundedIcon, title: 'Safe & Positive Space', copy: 'Respectful and supportive community' },
		{ icon: GroupsRoundedIcon, title: 'Real Parent Stories', copy: 'Honest experiences from other parents' },
		{ icon: LightbulbOutlinedIcon, title: 'Helpful Tips', copy: 'Practical ideas that work in real life' },
		{ icon: FavoriteBorderRoundedIcon, title: 'Stronger Together', copy: 'We grow and learn as a community' },
	];

	if (device === 'mobile') {
		const mobileArticles = [...latestNewsArticles.slice(0, 2), ...latestFreeArticles.slice(0, 2)];

		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Typography variant={'h1'}>{t('home.communityTitle')}</Typography>
					<Stack className={'community-main'}>
						{getNewsArticlesLoading || getFreeArticlesLoading ? (
							renderCommunityEmptyState(t('home.communityLoadingPosts'))
						) : mobileArticles.length === 0 ? (
							renderCommunityEmptyState(t('home.communityEmptyTitle'), true)
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
		const hasCommunityArticles = highlightArticles.length > 0;
		const hasVisibleCommunityArticles = visibleHighlightArticles.length > 0;

		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Stack className={'community-reference-header'}>
						<div>
							<Typography variant={'h1'}>
								{t('home.communityTitle')}
								<LocalFloristRoundedIcon aria-hidden="true" />
							</Typography>
							<Typography className={'community-section-copy'}>
								Real stories, tips, and questions from parents in the KidsGarden community.
							</Typography>
						</div>
						<Link className={'community-view-all'} href={'/community'}>
							View all in Community
							<ChevronRightRoundedIcon />
						</Link>
					</Stack>
					<div className={'community-tabs'} aria-label="Community categories">
						{tabDefinitions.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									type="button"
									className={activeTab === tab.key ? 'active' : ''}
									aria-pressed={activeTab === tab.key}
									onClick={() => setActiveTab(tab.key)}
									key={tab.key}
								>
									{tab.key !== 'all' && <Icon />}
									{tab.label}
								</button>
							);
						})}
					</div>
					{getNewsArticlesLoading || getFreeArticlesLoading || !hasCommunityArticles ? (
						<Box component={'div'} className={'community-empty-panel'}>
							<span>{t('home.communityUpdates')}</span>
							<h3>
								{getNewsArticlesLoading || getFreeArticlesLoading
									? t('home.communityLoadingTitle')
									: t('home.communityEmptyTitle')}
							</h3>
							<p>
								{t('home.communityEmptyCopy')}
							</p>
							<Link href={'/community?articleCategory=FREE'}>{t('home.visitCommunity')}</Link>
						</Box>
					) : (
						<>
							{hasVisibleCommunityArticles ? (
								<div className="community-highlight-grid">
									{visibleHighlightArticles.map((article, index) => renderCommunityHighlightCard(article, index))}
								</div>
							) : (
								<div className={'community-tab-empty'}>
									<p>No posts in this category yet.</p>
								</div>
							)}
							<div className={'community-create-strip'}>
								<div className={'community-create-icon'}>
									<GroupsRoundedIcon />
								</div>
								<div>
									<strong>Your experience can help another family</strong>
									<p>Share your tips, ask questions, and support other parents in the KidsGarden community.</p>
								</div>
								<Link href={'/mypage?category=writeArticle'}>
									<EditRoundedIcon />
									Create a Post
								</Link>
							</div>
							<div className={'community-benefits'}>
								{benefits.map((benefit) => {
									const Icon = benefit.icon;
									return (
										<div className={'community-benefit'} key={benefit.title}>
											<Icon />
											<div>
												<strong>{benefit.title}</strong>
												<p>{benefit.copy}</p>
											</div>
										</div>
									);
								})}
							</div>
						</>
					)}
				</Stack>
			</Stack>
		);
	}
};

export default CommunityBoards;
