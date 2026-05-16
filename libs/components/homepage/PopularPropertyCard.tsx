import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Property } from '../../types/property/property';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { getImageUrl } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { formatMonthlyFee } from '../../utils';

interface PopularPropertyCardProps {
	property: Property;
}

const PopularPropertyCard = (props: PopularPropertyCardProps) => {
	const { property } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const kindergarten: any = {
		images: (property as any)?.kindergartenImages || property?.propertyImages || [],
		rank: (property as any)?.kindergartenRank ?? property?.propertyRank,
		price: (property as any)?.kindergartenPrice ?? property?.propertyPrice,
		title: (property as any)?.kindergartenTitle ?? property?.propertyTitle,
		address: (property as any)?.kindergartenAddress ?? property?.propertyAddress,
		ageRange: (property as any)?.kindergartenAgeRange ?? property?.propertyBeds,
		programs: (property as any)?.kindergartenPrograms ?? property?.propertyRooms,
		capacity: (property as any)?.kindergartenCapacity ?? property?.propertySquare,
		views: (property as any)?.kindergartenViews ?? property?.propertyViews,
	};

	/** HANDLERS **/

	if (device === 'mobile') {
		return (
			<Stack className="popular-card-box">
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergarten.images[0])})` }}
				>
					{kindergarten.rank && kindergarten.rank >= 50 ? (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					) : (
						''
					)}

					<div className={'price'}>{formatMonthlyFee(kindergarten.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergarten.title}</strong>
					<p className={'desc'}>{kindergarten.address}</p>
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
						<p>Popular with parents</p>
						<div className="view-like-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{kindergarten.views}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	} else {
		return (
			<Stack className="popular-card-box">
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergarten.images[0])})` }}
				>
					{kindergarten.rank && kindergarten.rank >= 50 ? (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					) : (
						''
					)}

					<div className={'price'}>{formatMonthlyFee(kindergarten.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergarten.title}</strong>
					<p className={'desc'}>{kindergarten.address}</p>
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
						<p>Popular with parents</p>
						<div className="view-like-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{kindergarten.views}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default PopularPropertyCard;
