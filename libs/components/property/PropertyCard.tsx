import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import Link from 'next/link';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../utils';
import { getImageUrl } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

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
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const imagePath: string = getImageUrl(kindergarten?.kindergartenImages?.[0]);

	if (device === 'mobile') {
		return <div>KINDERGARTEN CARD</div>;
	} else {
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
					{kindergarten && kindergarten?.kindergartenRank > 0 && (
						<Box component={'div'} className={'top-badge'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<Typography>TOP</Typography>
						</Box>
					)}
					<Box component={'div'} className={'price-box'}>
						<Typography>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</Typography>
					</Box>
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
								{kindergarten.kindergartenAddress}, {kindergarten.kindergartenLocation}
							</Typography>
						</Stack>
					</Stack>
					<Stack className="options">
						<Stack className="option">
							<img src="/img/icons/bed.svg" alt="" /> <Typography>Age {kindergarten.kindergartenAgeRange}</Typography>
						</Stack>
						<Stack className="option">
							<img src="/img/icons/room.svg" alt="" /> <Typography>{kindergarten.kindergartenPrograms} programs</Typography>
						</Stack>
						<Stack className="option">
							<img src="/img/icons/expand.svg" alt="" /> <Typography>{kindergarten.kindergartenCapacity} spots</Typography>
						</Stack>
					</Stack>
					<Stack className="divider"></Stack>
					<Stack className="type-buttons">
						<Stack className="type">
							<Typography sx={{ fontWeight: 500, fontSize: '13px' }}>
								{getKindergartenTypeLabel(kindergarten.kindergartenType)}
							</Typography>
						</Stack>
						{!recentlyVisited && (
							<Stack className="buttons">
								<IconButton color={'default'}>
									<RemoveRedEyeIcon />
								</IconButton>
								<Typography className="view-cnt">{kindergarten?.kindergartenViews}</Typography>
								<IconButton
									color={'default'}
									onClick={() =>
										likeKindergartenHandler
											? likeKindergartenHandler(user, kindergarten?._id)
											: likePropertyHandler?.(user, kindergarten?._id)
									}
								>
									{myFavorites ? (
										<FavoriteIcon color="primary" />
									) : kindergarten?.meLiked && kindergarten?.meLiked[0]?.myFavorite ? (
										<FavoriteIcon color="primary" />
									) : (
										<FavoriteBorderIcon />
									)}
								</IconButton>
								<Typography className="view-cnt">{kindergarten?.kindergartenLikes}</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default PropertyCard;
