import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { getImageUrl } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { formatMonthlyFee } from '../../utils';

interface TrendingKindergartenCardProps {
	kindergarten: Kindergarten;
	likeKindergartenHandler?: (user: any, id: string) => Promise<void>;
}

const TrendingKindergartenCard = (props: TrendingKindergartenCardProps) => {
	const { kindergarten, likeKindergartenHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const kindergartenDetails = {
		images: kindergarten?.kindergartenImages || [],
		price: kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice,
		title: kindergarten?.kindergartenTitle,
		desc: kindergarten?.kindergartenDesc,
		ageRange: kindergarten?.kindergartenAgeRange,
		programs: kindergarten?.kindergartenPrograms,
		capacity: kindergarten?.kindergartenCapacity,
		views: kindergarten?.kindergartenViews,
		likes: kindergarten?.kindergartenLikes,
		meLiked: kindergarten?.meLiked,
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
			<Stack className="trend-card-box clickable-kindergarten-card" key={kindergarten._id} onClick={moveToKindergartenDetail}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergartenDetails.images[0])})` }}
				>
					<div>{formatMonthlyFee(kindergartenDetails.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergartenDetails.title}</strong>
					<p className={'desc'}>{kindergartenDetails.desc ?? 'No program description yet'}</p>
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
					<p>Parent favorite</p>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<Box component="span" className="view-stat-icon" aria-hidden="true">
							<RemoveRedEyeIcon sx={{ fontSize: 16 }} />
						</Box>
							<Typography className="view-cnt">{kindergartenDetails.views}</Typography>
							<IconButton color={'default'} onClick={() => likeKindergartenHandler?.(user, kindergarten._id)}>
								{kindergartenDetails?.meLiked && kindergartenDetails?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{kindergartenDetails.likes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
		} else {
			return (
				<Stack className="trend-card-box clickable-kindergarten-card" key={kindergarten._id} onClick={moveToKindergartenDetail}>
					<Box
						component={'div'}
						className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(kindergartenDetails.images[0])})` }}
				>
					<div>{formatMonthlyFee(kindergartenDetails.price)}</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{kindergartenDetails.title}</strong>
					<p className={'desc'}>{kindergartenDetails.desc ?? 'No program description yet'}</p>
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
					<p>Parent favorite</p>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<Box component="span" className="view-stat-icon" aria-hidden="true">
							<RemoveRedEyeIcon sx={{ fontSize: 16 }} />
						</Box>
							<Typography className="view-cnt">{kindergartenDetails.views}</Typography>
							<IconButton color={'default'} onClick={() => likeKindergartenHandler?.(user, kindergarten._id)}>
								{kindergartenDetails?.meLiked && kindergartenDetails?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{kindergartenDetails.likes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default TrendingKindergartenCard;
