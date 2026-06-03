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

const KindergartenCard = (props: KindergartenCardProps) => {
	const { likeKindergartenHandler, myFavorites, recentlyVisited } = props;
	const kindergarten = props.kindergarten || mapLegacyKindergartenApiFields(props.property);
	const user = useReactiveVar(userVar);
	const kindergartenImageUrl: string = getImageUrl(kindergarten?.kindergartenImages?.[0]);
	const kindergartenRank = kindergarten?.kindergartenRank || 0;
	const kindergartenLikes = kindergarten?.kindergartenLikes || 0;
	const kindergartenViews = kindergarten?.kindergartenViews || 0;
	const badgeLabel =
		kindergartenRank > 0
			? 'Top Rated'
			: kindergartenLikes > 0
				? 'Popular'
				: kindergartenViews > 0
					? 'Trending'
					: 'Verified';
	const description =
		kindergarten?.kindergartenDesc ||
		'A warm, safe learning environment where children can grow with confidence.';
	const primaryLocation = kindergarten?.kindergartenLocation || kindergarten?.kindergartenAddress || 'KidsGarden center';
	const kindergartenTypeLabel = kindergarten?.kindergartenType
		? getKindergartenTypeLabel(kindergarten.kindergartenType)
		: 'Kindergarten';

	return (
		<Stack className="card-config">
			<Stack className="top">
				<Link
					href={{
						pathname: '/kindergartens/detail',
						query: { id: kindergarten?._id },
					}}
				>
					<img src={kindergartenImageUrl} alt="" />
				</Link>
				<Box component={'div'} className={`top-badge ${badgeLabel.toLowerCase().replace(/\s/g, '-')}`}>
					<Typography>{badgeLabel}</Typography>
				</Box>
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
							<Typography>{kindergarten?.kindergartenAgeRange || 'All'} years</Typography>
					</Stack>
					<Stack className="option">
							<Typography>{kindergarten?.kindergartenCapacity || 0} capacity</Typography>
					</Stack>
					<Stack className="option">
							<Typography>{kindergarten?.kindergartenPrograms || 0} programs</Typography>
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
							View Details
						</Link>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default KindergartenCard;
