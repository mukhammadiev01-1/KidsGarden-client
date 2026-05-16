import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { getImageUrl } from '../../config';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../utils';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface PropertyBigCardProps {
	kindergarten?: Kindergarten;
	property?: any;
}

const PropertyBigCard = (props: PropertyBigCardProps) => {
	const kindergarten: any = props.kindergarten || {
		_id: props.property?._id,
		kindergartenImages: props.property?.propertyImages || [],
		kindergartenRank: props.property?.propertyRank,
		kindergartenPrice: props.property?.propertyPrice,
		kindergartenTitle: props.property?.propertyTitle,
		kindergartenAddress: props.property?.propertyAddress,
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
	const router = useRouter();

	/** HANDLERS **/
	const goKindergartenDetatilPage = (kindergartenId: string) => {
		router.push(`/property/detail?id=${kindergartenId}`);
	};

	if (device === 'mobile') {
		return <div>KINDERGARTEN BIG CARD</div>;
	} else {
		return (
			<Stack className="property-big-card-box" onClick={() => goKindergartenDetatilPage(kindergarten?._id)}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergarten?.kindergartenImages?.[0])})` }}
				>
					{kindergarten?.kindergartenRank && kindergarten?.kindergartenRank >= 50 && (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					)}

					<div className={'price'}>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergarten?.kindergartenTitle}</strong>
					<p className={'desc'}>{kindergarten?.kindergartenAddress}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/bed.svg" alt="" />
							<span>Age {kindergarten?.kindergartenAgeRange}</span>
						</div>
						<div>
							<img src="/img/icons/room.svg" alt="" />
							<span>{kindergarten?.kindergartenPrograms} programs</span>
						</div>
						<div>
							<img src="/img/icons/expand.svg" alt="" />
							<span>{kindergarten?.kindergartenCapacity} spots</span>
						</div>
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<div>
							<p>{getKindergartenTypeLabel(kindergarten?.kindergartenType)}</p>
						</div>
						<div className="buttons-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{kindergarten?.kindergartenViews}</Typography>
							<IconButton
								color={'default'}
								onClick={(e) => {
									e.stopPropagation();
								}}
							>
								{kindergarten?.meLiked && kindergarten?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{kindergarten?.kindergartenLikes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default PropertyBigCard;
