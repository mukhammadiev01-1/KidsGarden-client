import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { getImageUrl } from '../../config';
import { useRouter } from 'next/router';
import { formatMonthlyFee } from '../../utils';

interface PopularKindergartenCardProps {
	kindergarten: Kindergarten;
}

const PopularKindergartenCard = (props: PopularKindergartenCardProps) => {
	const { kindergarten } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const kindergartenDetails = {
		images: kindergarten?.kindergartenImages || [],
		rank: kindergarten?.kindergartenRank,
		price: kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice,
		title: kindergarten?.kindergartenTitle,
		address: kindergarten?.kindergartenAddress,
		ageRange: kindergarten?.kindergartenAgeRange,
		programs: kindergarten?.kindergartenPrograms,
		capacity: kindergarten?.kindergartenCapacity,
		views: kindergarten?.kindergartenViews,
	};

	/** HANDLERS **/
	const moveToKindergartenDetail = () => {
		if (!kindergarten?._id) return;
		void router.push({
			pathname: '/kindergartens/detail',
			query: { kindergartenId: kindergarten._id },
		});
	};

	if (device === 'mobile') {
		return (
			<Stack className="popular-card-box clickable-kindergarten-card" onClick={moveToKindergartenDetail}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergartenDetails.images[0])})` }}
				>
					{kindergartenDetails.rank && kindergartenDetails.rank >= 50 ? (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					) : (
						''
					)}

					<div className={'price'}>{formatMonthlyFee(kindergartenDetails.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergartenDetails.title}</strong>
					<p className={'desc'}>{kindergartenDetails.address}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/age.svg" alt="" />
							<span>Age {kindergartenDetails.ageRange}</span>
						</div>
						<div>
							<img src="/img/icons/program.svg" alt="" />
							<span>{kindergartenDetails.programs} programs</span>
						</div>
						<div>
							<img src="/img/icons/capacity.svg" alt="" />
							<span>{kindergartenDetails.capacity} spots</span>
						</div>
					</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>Popular with parents</p>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
							<Typography className="view-cnt">{kindergartenDetails.views}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
		} else {
			return (
				<Stack className="popular-card-box clickable-kindergarten-card" onClick={moveToKindergartenDetail}>
					<Box
						component={'div'}
						className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergartenDetails.images[0])})` }}
				>
					{kindergartenDetails.rank && kindergartenDetails.rank >= 50 ? (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					) : (
						''
					)}

					<div className={'price'}>{formatMonthlyFee(kindergartenDetails.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergartenDetails.title}</strong>
					<p className={'desc'}>{kindergartenDetails.address}</p>
					<div className={'options'}>
						<div>
							<img src="/img/icons/age.svg" alt="" />
							<span>Age {kindergartenDetails.ageRange}</span>
						</div>
						<div>
							<img src="/img/icons/program.svg" alt="" />
							<span>{kindergartenDetails.programs} programs</span>
						</div>
						<div>
							<img src="/img/icons/capacity.svg" alt="" />
							<span>{kindergartenDetails.capacity} spots</span>
						</div>
					</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>Popular with parents</p>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
							<Typography className="view-cnt">{kindergartenDetails.views}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default PopularKindergartenCard;
