import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Property } from '../../types/property/property';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { getImageUrl } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { formatMonthlyFee } from '../../utils';

interface TrendPropertyCardProps {
	property: Property;
	likePropertyHandler?: (user: any, id: string) => Promise<void>;
}

const TrendPropertyCard = (props: TrendPropertyCardProps) => {
	const { property, likePropertyHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const kindergarten: any = {
		images: (property as any)?.kindergartenImages || property?.propertyImages || [],
		price: (property as any)?.kindergartenPrice ?? property?.propertyPrice,
		title: (property as any)?.kindergartenTitle ?? property?.propertyTitle,
		desc: (property as any)?.kindergartenDesc ?? property?.propertyDesc,
		ageRange: (property as any)?.kindergartenAgeRange ?? property?.propertyBeds,
		programs: (property as any)?.kindergartenPrograms ?? property?.propertyRooms,
		capacity: (property as any)?.kindergartenCapacity ?? property?.propertySquare,
		views: (property as any)?.kindergartenViews ?? property?.propertyViews,
		likes: (property as any)?.kindergartenLikes ?? property?.propertyLikes,
		meLiked: (property as any)?.meLiked,
	};

	/** HANDLERS **/
	const moveToKindergartenDetail = () => {
		if (!property?._id) return;
		void router.push({
			pathname: '/property/detail',
			query: { kindergartenId: property._id },
		});
	};

	if (device === 'mobile') {
		return (
			<Stack className="trend-card-box clickable-kindergarten-card" key={property._id} onClick={moveToKindergartenDetail}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergarten.images[0])})` }}
				>
					<div>{formatMonthlyFee(kindergarten.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergarten.title}</strong>
					<p className={'desc'}>{kindergarten.desc ?? 'No program description yet'}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/bed.svg" alt="" />
							<span>Age {kindergarten.ageRange}</span>
						</div>
						<div>
							<img src="/img/icons/room.svg" alt="" />
							<span>{kindergarten.programs} programs</span>
						</div>
						<div>
							<img src="/img/icons/expand.svg" alt="" />
							<span>{kindergarten.capacity} spots</span>
						</div>
					</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>Parent favorite</p>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
							<Typography className="view-cnt">{kindergarten.views}</Typography>
							<IconButton color={'default'} onClick={() => likePropertyHandler?.(user, property._id)}>
								{kindergarten?.meLiked && kindergarten?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{kindergarten.likes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
		} else {
			return (
				<Stack className="trend-card-box clickable-kindergarten-card" key={property._id} onClick={moveToKindergartenDetail}>
					<Box
						component={'div'}
						className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergarten.images[0])})` }}
				>
					<div>{formatMonthlyFee(kindergarten.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergarten.title}</strong>
					<p className={'desc'}>{kindergarten.desc ?? 'No program description yet'}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/bed.svg" alt="" />
							<span>Age {kindergarten.ageRange}</span>
						</div>
						<div>
							<img src="/img/icons/room.svg" alt="" />
							<span>{kindergarten.programs} programs</span>
						</div>
						<div>
							<img src="/img/icons/expand.svg" alt="" />
							<span>{kindergarten.capacity} spots</span>
						</div>
					</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>Parent favorite</p>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
							<Typography className="view-cnt">{kindergarten.views}</Typography>
							<IconButton color={'default'} onClick={() => likePropertyHandler?.(user, property._id)}>
								{kindergarten?.meLiked && kindergarten?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{kindergarten.likes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default TrendPropertyCard;
