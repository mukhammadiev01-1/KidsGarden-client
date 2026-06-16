import React from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper';
import PopularKindergartenCard from './PopularKindergartenCard';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import Link from 'next/link';
import { KindergartensInquiry } from '../../types/kindergarten/kindergarten.input';
import { useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../../apollo/user/query';

interface PopularKindergartensProps {
	initialInput: KindergartensInquiry;
}

const PopularKindergartens = (props: PopularKindergartensProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/
	const {
		data,
		loading: getKindergartensLoading,
		error: getKindergartensError,
	} = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
	});

	/** HANDLERS **/

	const popularKindergartens: Kindergarten[] = data?.getKindergartens?.list ?? [];
	const displayedKindergartens = popularKindergartens.slice(0, 3);
	const hasNetworkError = Boolean(getKindergartensError);

	const renderEmptyState = (message: string) => (
		<Box component={'div'} className={'homepage-empty-state'}>
			<p>{message}</p>
			<Link href={'/kindergartens'}>Explore all kindergartens</Link>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'popular-kindergartens'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Popular Kindergartens</span>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading && displayedKindergartens.length === 0 ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading popular kindergartens...</p>
							</Box>
						) : hasNetworkError ? (
							renderEmptyState('Popular kindergartens are temporarily unavailable.')
						) : displayedKindergartens.length === 0 ? (
							renderEmptyState('Popular kindergartens will appear as families browse.')
						) : (
							<Swiper
								className={'popular-kindergarten-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={25}
								modules={[Autoplay]}
							>
								{displayedKindergartens.map((kindergarten: Kindergarten) => {
									return (
										<SwiperSlide key={kindergarten._id} className={'popular-kindergarten-slide'}>
											<PopularKindergartenCard kindergarten={kindergarten} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'popular-kindergartens'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Popular Kindergartens</span>
							<p>Most viewed active centers from the KidsGarden database</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'more-box'}>
								<Link href={'/kindergartens'}>
									<span>See All Kindergartens</span>
								</Link>
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading && displayedKindergartens.length === 0 ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading popular kindergartens...</p>
							</Box>
						) : hasNetworkError ? (
							renderEmptyState('Popular kindergartens are temporarily unavailable.')
						) : displayedKindergartens.length === 0 ? (
							renderEmptyState('Popular kindergartens will appear as families browse.')
						) : (
							<Box component={'div'} className={'popular-kindergarten-grid'}>
								{displayedKindergartens.map((kindergarten: Kindergarten) => {
									return (
										<PopularKindergartenCard kindergarten={kindergarten} key={kindergarten._id} />
									);
								})}
							</Box>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

PopularKindergartens.defaultProps = {
	initialInput: {
		page: 1,
		limit: 3,
		sort: 'kindergartenViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularKindergartens;
