import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import Link from 'next/link';
import { getKindergartenTypeLabel } from '../../utils';
import { getImageUrl } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import { useTranslation } from 'next-i18next';

interface LegacyKindergartenApiFields {
	_id?: string;
	propertyImages?: string[];
	propertyRank?: number;
	propertyPrice?: number;
	propertyTitle?: string;
	propertyAddress?: string;
	propertyLocation?: Kindergarten['kindergartenLocation'];
	propertyBeds?: number;
	propertyRooms?: number;
	propertySquare?: number;
	propertyType?: Kindergarten['kindergartenType'];
	propertyViews?: number;
	propertyLikes?: number;
	meLiked?: Kindergarten['meLiked'];
}

interface KindergartenCardProps {
	kindergarten?: Kindergarten;
	property?: LegacyKindergartenApiFields;
	likeKindergartenHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const mapLegacyKindergartenApiFields = (legacyKindergarten?: LegacyKindergartenApiFields): Partial<Kindergarten> => {
	return {
		_id: legacyKindergarten?._id,
		kindergartenImages: legacyKindergarten?.propertyImages || [],
		kindergartenRank: legacyKindergarten?.propertyRank,
		monthlyFee: legacyKindergarten?.propertyPrice,
		kindergartenPrice: legacyKindergarten?.propertyPrice,
		kindergartenTitle: legacyKindergarten?.propertyTitle,
		kindergartenAddress: legacyKindergarten?.propertyAddress,
		kindergartenLocation: legacyKindergarten?.propertyLocation,
		kindergartenAgeRange: legacyKindergarten?.propertyBeds,
		kindergartenPrograms: legacyKindergarten?.propertyRooms,
		kindergartenCapacity: legacyKindergarten?.propertySquare,
		kindergartenType: legacyKindergarten?.propertyType,
		kindergartenViews: legacyKindergarten?.propertyViews,
		kindergartenLikes: legacyKindergarten?.propertyLikes,
		meLiked: legacyKindergarten?.meLiked,
	};
};

export const formatDistanceAway = (distanceMeters?: number, t?: (key: string, options?: any) => string): string => {
	if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters)) return '';
	if (distanceMeters < 1000) {
		const distance = Math.max(0, Math.round(distanceMeters));
		return t ? t('kindergartens.card.distanceMeters', { distance }) : `${distance} m away`;
	}
	const distance = (distanceMeters / 1000).toFixed(1);
	return t ? t('kindergartens.card.distanceKm', { distance }) : `${distance} km away`;
};

const KindergartenCard = (props: KindergartenCardProps) => {
	const { likeKindergartenHandler, myFavorites, recentlyVisited } = props;
	const kindergarten = props.kindergarten || mapLegacyKindergartenApiFields(props.property);
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const kindergartenImageUrl: string = getImageUrl(kindergarten?.kindergartenImages?.[0]);
	const kindergartenRank = kindergarten?.kindergartenRank || 0;
	const kindergartenLikes = kindergarten?.kindergartenLikes || 0;
	const kindergartenViews = kindergarten?.kindergartenViews || 0;
	const badgeTone =
		kindergartenRank > 0 ? 'top-rated' : kindergartenLikes > 0 ? 'popular' : kindergartenViews > 0 ? 'trending' : 'verified';
	const badgeLabel =
		badgeTone === 'top-rated'
			? t('kindergartens.card.topRated')
			: badgeTone === 'popular'
			? t('kindergartens.card.popular')
			: badgeTone === 'trending'
			? t('kindergartens.card.trending')
			: t('kindergartens.card.verified');
	const description = kindergarten?.kindergartenDesc || t('kindergartens.card.defaultDescription');
	const primaryLocation = kindergarten?.kindergartenLocation || kindergarten?.kindergartenAddress || t('kindergartens.card.kidsGardenCenter');
	const kindergartenTypeLabel = kindergarten?.kindergartenType
		? t(`filters.centerTypes.${kindergarten.kindergartenType}`, { defaultValue: getKindergartenTypeLabel(kindergarten.kindergartenType) })
		: t('kindergartens.card.kindergarten');
	const distanceLabel = formatDistanceAway(kindergarten?.distanceMeters, t);

	return (
		<Stack className="card-config">
			<Stack className="top">
				<Link
					href={{
						pathname: '/kindergartens/detail',
						query: { id: kindergarten?._id },
					}}
					aria-label={t('kindergartens.card.like')}
				>
					<img src={kindergartenImageUrl} alt="" />
				</Link>
				<Box component={'div'} className={`top-badge ${badgeTone}`}>
					<Typography>{badgeLabel}</Typography>
				</Box>
				{distanceLabel && (
					<Box component="div" className="kg-distance-badge">
						<NearMeRoundedIcon />
						<Typography>{distanceLabel}</Typography>
					</Box>
				)}
				<IconButton
					className="kg-card-like"
					color={'default'}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
							if (kindergarten?._id) likeKindergartenHandler?.(user, kindergarten._id);
					}}
				>
					{myFavorites ? (
						<FavoriteIcon color="primary" />
					) : kindergarten?.meLiked && kindergarten?.meLiked[0]?.myFavorite ? (
						<FavoriteIcon color="primary" />
					) : (
						<FavoriteBorderIcon />
					)}
				</IconButton>
			</Stack>
			<Stack className="bottom">
				<Stack className="name-address">
					<Stack className="name">
						<Link
							href={{
								pathname: '/kindergartens/detail',
								query: { id: kindergarten?._id },
							}}
						>
								<Typography>{kindergarten?.kindergartenTitle}</Typography>
						</Link>
					</Stack>
					<Stack className="address">
						<Typography>
							<LocationOnOutlinedIcon />
							{primaryLocation}
						</Typography>
					</Stack>
				</Stack>
				<Typography className="kg-card-description">{description}</Typography>
				<Stack className="options">
					<Stack className="option">
							<Typography>{kindergarten?.kindergartenAgeRange || t('kindergartens.card.allAges')} {t('kindergartens.card.years')}</Typography>
					</Stack>
					<Stack className="option">
							<Typography>{t('kindergartens.card.capacity', { count: kindergarten?.kindergartenCapacity || 0 })}</Typography>
					</Stack>
					<Stack className="option">
							<Typography>{t('kindergartens.card.programs', { count: kindergarten?.kindergartenPrograms || 0 })}</Typography>
					</Stack>
				</Stack>
				<Stack className="divider"></Stack>
				<Stack className="type-buttons">
					<Stack className="type">
							<Typography sx={{ fontWeight: 500, fontSize: '13px' }}>{kindergartenTypeLabel}</Typography>
					</Stack>
					<Stack className="card-actions">
						{!recentlyVisited && (
							<Stack className="buttons">
								<StarRoundedIcon className="rating-icon" />
								<Typography className="view-cnt">{kindergarten?.kindergartenRank || '4.8'}</Typography>
								<RemoveRedEyeIcon className="view-icon" />
								<Typography className="view-cnt">{kindergarten?.kindergartenViews}</Typography>
							</Stack>
						)}
						<Link
							className={'details-link'}
							href={{
								pathname: '/kindergartens/detail',
								query: { id: kindergarten?._id },
							}}
						>
							{t('kindergartens.card.viewDetails')}
						</Link>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default KindergartenCard;
