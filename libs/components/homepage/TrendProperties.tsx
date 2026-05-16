import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import { Property } from '../../types/property/property';
import { PropertiesInquiry } from '../../types/property/property.input';
import TrendPropertyCard from './TrendPropertyCard';
import { useMutation, useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../../apollo/user/query';
import { LIKE_TARGET_KINDERGARTEN } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface TrendPropertiesProps {
	initialInput: PropertiesInquiry;
}

const TrendProperties = (props: TrendPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendProperties, setTrendProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);
	const { loading: getKindergartensLoading, refetch: getKindergartensRefetch } = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendProperties(data?.getKindergartens?.list ?? []);
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

	if (trendProperties) console.log('trendProperties:', trendProperties);
	if (!trendProperties) return null;

	const renderEmptyState = (message: string) => (
		<Box component={'div'} className={'homepage-empty-state'}>
			<p>{message}</p>
			<Link href={'/property'}>Explore all kindergartens</Link>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'trend-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Trending Kindergartens</span>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading kindergartens...</p>
							</Box>
						) : trendProperties.length === 0 ? (
							renderEmptyState('Trending kindergartens will appear as parents save centers.')
						) : (
							<Swiper
								className={'trend-property-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{trendProperties.map((property: Property) => {
									return (
										<SwiperSlide key={property._id} className={'trend-property-slide'}>
											<TrendPropertyCard property={property} likePropertyHandler={likeKindergartenHandler} />
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
			<Stack className={'trend-properties'}>
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
						) : trendProperties.length === 0 ? (
							renderEmptyState('Trending kindergartens will appear as parents save centers.')
						) : (
							<Swiper
								className={'trend-property-swiper'}
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
								{trendProperties.map((property: Property) => {
									return (
										<SwiperSlide key={property._id} className={'trend-property-slide'}>
											<TrendPropertyCard property={property} likePropertyHandler={likeKindergartenHandler} />
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

TrendProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'kindergartenLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendProperties;
