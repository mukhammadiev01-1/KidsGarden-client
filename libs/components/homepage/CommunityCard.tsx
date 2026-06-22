import React from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Box } from '@mui/material';
import Moment from 'react-moment';
import { BoardArticle } from '../../types/board-article/board-article';
import { getImageUrl } from '../../config';

interface CommunityCardProps {
	vertical: boolean;
	article: BoardArticle;
	index: number;
}

const ARTICLE_IMAGE_FALLBACK = '/img/kidsgarden/articles/article-play-based-learning.png';

const resolveArticleImage = (article: BoardArticle): string => {
	const rawImage = Array.isArray((article as any)?.articleImage)
		? (article as any).articleImage[0]
		: article?.articleImage;

	return getImageUrl(rawImage, ARTICLE_IMAGE_FALLBACK);
};

const CommunityCard = (props: CommunityCardProps) => {
	const { vertical, article, index } = props;
	const device = useDeviceDetect();
	const articleImage = resolveArticleImage(article);
	const categoryLabels: Record<string, string> = {
		FREE: 'Parent Board',
		NEWS: 'News',
		RECOMMEND: 'Kindergarten Updates',
		HUMOR: 'Community',
	};

	if (device === 'mobile' || !vertical) {
		return (
			<Link href={`/community/detail?articleCategory=${article?.articleCategory}&id=${article?._id}`}>
				<Box component={'div'} className="horizontal-card">
					<img src={articleImage} alt={article?.articleTitle || 'KidsGarden community article'} />
					<div>
						<strong>{article.articleTitle}</strong>
						<span>
							{categoryLabels[article?.articleCategory] || 'Community'} · <Moment format="DD.MM.YY">{article?.createdAt}</Moment>
						</span>
					</div>
				</Box>
			</Link>
		);
	}

	return (
		<Link href={`/community/detail?articleCategory=${article?.articleCategory}&id=${article?._id}`}>
			<Box component={'div'} className={'vertical-card'}>
				<div className={'community-img'} style={{ backgroundImage: `url(${articleImage})` }}>
					<div>{index + 1}</div>
				</div>
				<strong>{article?.articleTitle}</strong>
				<span>{categoryLabels[article?.articleCategory] || 'Community'}</span>
			</Box>
		</Link>
	);
};

export default CommunityCard;
