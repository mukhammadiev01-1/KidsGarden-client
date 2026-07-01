import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { getImageUrl } from '../../config';
import { useRouter } from 'next/router';
import { formatMonthlyFee } from '../../utils';
import { useTranslation } from 'next-i18next';

interface PopularKindergartenCardProps {
	kindergarten: Kindergarten;
}

const PopularKindergartenCard = (props: PopularKindergartenCardProps) => {
	const { kindergarten } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const kindergartenDetails = {
		images: kindergarten?.kindergartenImages || [],
		price: kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice,
		title: kindergarten?.kindergartenTitle || t('kindergartens.card.kindergarten'),
		address: kindergarten?.kindergartenAddress || kindergarten?.kindergartenLocation || t('kindergartens.card.locationPending'),
		ageRange: kindergarten?.kindergartenAgeRange,
		programs: kindergarten?.kindergartenPrograms,
		capacity: kindergarten?.kindergartenCapacity,
		views: kindergarten?.kindergartenViews,
		status: kindergarten?.kindergartenStatus,
	};
	const cardImage = getImageUrl(kindergartenDetails.images[0]);
	const ageLabel = kindergartenDetails.ageRange
		? t('home.ageLabel', { range: kindergartenDetails.ageRange })
		: t('home.ageInfoPending');
	const programsLabel =
		kindergartenDetails.programs !== undefined && kindergartenDetails.programs !== null
			? t('home.programsCount', { count: kindergartenDetails.programs })
			: t('home.programsPending');
	const capacityLabel =
		kindergartenDetails.capacity !== undefined && kindergartenDetails.capacity !== null
			? t('home.capacitySpots', { count: kindergartenDetails.capacity })
			: t('home.capacityPending');

	const moveToKindergartenDetail = () => {
		if (!kindergarten?._id) return;
		void router.push({
			pathname: '/kindergartens/detail',
			query: { id: kindergarten._id },
		});
	};

	if (!device) return null;

	return (
		<Stack className="popular-card-box clickable-kindergarten-card" onClick={moveToKindergartenDetail}>
			<Box
				component={'div'}
				className={'card-img'}
				style={{ backgroundImage: `url(${cardImage})` }}
			>
				{kindergartenDetails.status ? (
					<div className={'status'}>
						<span>{kindergartenDetails.status === 'ACTIVE' ? t('home.active') : kindergartenDetails.status}</span>
					</div>
				) : null}

				<div className={'price'}>{formatMonthlyFee(kindergartenDetails.price)}</div>
			</Box>
			<Box component={'div'} className={'info'}>
				<strong className={'title'}>{kindergartenDetails.title}</strong>
				<p className={'desc'}>{kindergartenDetails.address}</p>
				<div className={'options'}>
					<div>
						<img src="/img/icons/age.svg" alt="" />
						<span>{ageLabel}</span>
					</div>
					<div>
						<img src="/img/icons/program.svg" alt="" />
						<span>{programsLabel}</span>
					</div>
					<div>
						<img src="/img/icons/capacity.svg" alt="" />
						<span>{capacityLabel}</span>
					</div>
				</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>{t('home.popularWithParents')}</p>
					<span className={'details-cta'}>{t('home.viewDetails')}</span>
					<div className="view-like-box" onClick={(event) => event.stopPropagation()}>
						<Box component="span" className="view-stat-icon" aria-hidden="true">
							<RemoveRedEyeIcon sx={{ fontSize: 16 }} />
						</Box>
						<Typography className="view-cnt">{kindergartenDetails.views || 0}</Typography>
					</div>
				</div>
			</Box>
		</Stack>
	);
};

export default PopularKindergartenCard;
