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

interface PropertyCardType {
	kindergarten?: Kindergarten;
	property?: any;
	likeKindergartenHandler?: any;
	likePropertyHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const PropertyCard = (props: PropertyCardType) => {
	const { likeKindergartenHandler, likePropertyHandler, myFavorites, recentlyVisited } = props;
	const kindergarten: any = props.kindergarten || {
		_id: props.property?._id,
		kindergartenImages: props.property?.propertyImages || [],
		kindergartenRank: props.property?.propertyRank,
		kindergartenPrice: props.property?.propertyPrice,
		kindergartenTitle: props.property?.propertyTitle,
		kindergartenAddress: props.property?.propertyAddress,
		kindergartenLocation: props.property?.propertyLocation,
		kindergartenAgeRange: props.property?.propertyBeds,
		kindergartenPrograms: props.property?.propertyRooms,
		kindergartenCapacity: props.property?.propertySquare,
		kindergartenType: props.property?.propertyType,
		kindergartenViews: props.property?.propertyViews,
		kindergartenLikes: props.property?.propertyLikes,
		meLiked: props.property?.meLiked,
	};
	const user = useReactiveVar(userVar);
	const imagePath: string = getImageUrl(kindergarten?.kindergartenImages?.[0]);
	const badgeLabel =
		kindergarten?.kindergartenRank > 0
			? 'Top Rated'
			: kindergarten?.kindergartenLikes > 0
				? 'Popular'
				: kindergarten?.kindergartenViews > 0
					? 'Trending'
					: 'Verified';
	const description =
		kindergarten?.kindergartenDesc ||
		'A warm, safe learning environment where children can grow with confidence.';
	const primaryLocation = kindergarten?.kindergartenLocation || kindergarten?.kindergartenAddress || 'KidsGarden center';

	return (
		<Stack className="card-config">
			<Stack className="top">
				<Link
					href={{
						pathname: '/property/detail',
						query: { id: kindergarten?._id },
					}}
				>
					<img src={imagePath} alt="" />
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
						likeKindergartenHandler
							? likeKindergartenHandler(user, kindergarten?._id)
							: likePropertyHandler?.(user, kindergarten?._id);
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
								pathname: '/property/detail',
								query: { id: kindergarten?._id },
							}}
						>
							<Typography>{kindergarten.kindergartenTitle}</Typography>
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
						<Typography>{kindergarten.kindergartenAgeRange || 'All'} years</Typography>
					</Stack>
					<Stack className="option">
						<Typography>{kindergarten.kindergartenCapacity || 0} capacity</Typography>
					</Stack>
					<Stack className="option">
						<Typography>{kindergarten.kindergartenPrograms || 0} programs</Typography>
					</Stack>
				</Stack>
				<Stack className="divider"></Stack>
				<Stack className="type-buttons">
					<Stack className="type">
						<Typography sx={{ fontWeight: 500, fontSize: '13px' }}>
							{getKindergartenTypeLabel(kindergarten.kindergartenType)}
						</Typography>
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
								pathname: '/property/detail',
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

export default PropertyCard;
