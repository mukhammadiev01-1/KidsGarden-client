import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { getImageUrl } from '../../config';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../utils';
import { useRouter } from 'next/router';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface LegacyKindergartenApiFields {
	_id?: string;
	propertyImages?: string[];
	propertyRank?: number;
	propertyPrice?: number;
	propertyTitle?: string;
	propertyAddress?: string;
	propertyBeds?: number;
	propertyRooms?: number;
	propertySquare?: number;
	propertyType?: Kindergarten['kindergartenType'];
	propertyViews?: number;
	propertyLikes?: number;
	meLiked?: Kindergarten['meLiked'];
}

interface KindergartenBigCardProps {
	kindergarten?: Kindergarten;
	property?: LegacyKindergartenApiFields;
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
		kindergartenAgeRange: legacyKindergarten?.propertyBeds,
		kindergartenPrograms: legacyKindergarten?.propertyRooms,
		kindergartenCapacity: legacyKindergarten?.propertySquare,
		kindergartenType: legacyKindergarten?.propertyType,
		kindergartenViews: legacyKindergarten?.propertyViews,
		kindergartenLikes: legacyKindergarten?.propertyLikes,
		meLiked: legacyKindergarten?.meLiked,
	};
};

const KindergartenBigCard = (props: KindergartenBigCardProps) => {
	const kindergarten = props.kindergarten || mapLegacyKindergartenApiFields(props.property);
	const router = useRouter();

	/** HANDLERS **/
	const goKindergartenDetailPage = (kindergartenId?: string) => {
		if (!kindergartenId) return;
		router.push(`/kindergartens/detail?id=${kindergartenId}`);
	};
	const kindergartenTypeLabel = kindergarten?.kindergartenType
		? getKindergartenTypeLabel(kindergarten.kindergartenType)
		: 'Kindergarten';

	return (
		<Stack className="kindergarten-big-card-box" onClick={() => goKindergartenDetailPage(kindergarten?._id)}>
			<Box
				component={'div'}
				className={'card-img'}
				style={{ backgroundImage: `url(${getImageUrl(kindergarten?.kindergartenImages?.[0])})` }}
			>
				{kindergarten?.kindergartenRank && kindergarten?.kindergartenRank >= 50 && (
					<div className={'status'}>
						<span>top</span>
					</div>
				)}

					<div className={'price'}>{formatMonthlyFee(kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice)}</div>
			</Box>
			<Box component={'div'} className={'info'}>
				<strong className={'title'}>{kindergarten?.kindergartenTitle}</strong>
				<p className={'desc'}>{kindergarten?.kindergartenAddress}</p>
				<div className={'options'}>
					<div>
						<span>Age {kindergarten?.kindergartenAgeRange}</span>
					</div>
					<div>
						<span>{kindergarten?.kindergartenPrograms} programs</span>
					</div>
					<div>
						<span>{kindergarten?.kindergartenCapacity} spots</span>
					</div>
				</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<div>
							<p>{kindergartenTypeLabel}</p>
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
};

export default KindergartenBigCard;
