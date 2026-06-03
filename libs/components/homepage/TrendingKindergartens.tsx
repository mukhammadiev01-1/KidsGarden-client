import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { KindergartensInquiry } from '../../types/kindergarten/kindergarten.input';
import TrendingKindergartenCard from './TrendingKindergartenCard';
import { useMutation, useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../../apollo/user/query';
import { LIKE_TARGET_KINDERGARTEN } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface TrendingKindergartensProps {
	initialInput: KindergartensInquiry;
}

const TrendingKindergartens = (props: TrendingKindergartensProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendingKindergartens, setTrendingKindergartens] = useState<Kindergarten[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);
	const { loading: getKindergartensLoading, refetch: getKindergartensRefetch } = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendingKindergartens(data?.getKindergartens?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeKindergartenHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

			await likeTargetKindergarten({ variables: { input: id } });
			await getKindergartensRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeKindergartenHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!trendingKindergartens) return null;

	const renderEmptyState = (message: string) => (
		<Box component={'div'} className={'homepage-empty-state'}>
			<p>{message}</p>
			<Link href={'/kindergartens'}>Explore all kindergartens</Link>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'trending-kindergartens'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Trending Kindergartens</span>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading kindergartens...</p>
							</Box>
						) : trendingKindergartens.length === 0 ? (
							renderEmptyState('Trending kindergartens will appear as parents save centers.')
						) : (
							<Swiper
								className={'trending-kindergarten-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{trendingKindergartens.map((kindergarten: Kindergarten) => {
									return (
										<SwiperSlide key={kindergarten._id} className={'trending-kindergarten-slide'}>
											<TrendingKindergartenCard
												kindergarten={kindergarten}
												likeKindergartenHandler={likeKindergartenHandler}
											/>
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
			<Stack className={'trending-kindergartens'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Trending Kindergartens</span>
							<p>Centers parents are saving and reviewing</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-trend-prev'} />
								<div className={'swiper-trend-pagination'}></div>
								<EastIcon className={'swiper-trend-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading kindergartens...</p>
							</Box>
						) : trendingKindergartens.length === 0 ? (
							renderEmptyState('Trending kindergartens will appear as parents save centers.')
						) : (
							<Swiper
								className={'trending-kindergarten-swiper'}
								slidesPerView={'auto'}
								spaceBetween={15}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-trend-next',
									prevEl: '.swiper-trend-prev',
								}}
								pagination={{
									el: '.swiper-trend-pagination',
								}}
							>
								{trendingKindergartens.map((kindergarten: Kindergarten) => {
									return (
										<SwiperSlide key={kindergarten._id} className={'trending-kindergarten-slide'}>
											<TrendingKindergartenCard
												kindergarten={kindergarten}
												likeKindergartenHandler={likeKindergartenHandler}
											/>
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TrendingKindergartens.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'kindergartenLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendingKindergartens;
