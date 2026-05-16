import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import PopularPropertyCard from './PopularPropertyCard';
import { Property } from '../../types/property/property';
import Link from 'next/link';
import { PropertiesInquiry } from '../../types/property/property.input';
import { useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../../apollo/user/query';
import { T } from '../../types/common';

interface PopularPropertiesProps {
	initialInput: PropertiesInquiry;
}

const PopularProperties = (props: PopularPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [popularProperties, setPopularProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const { loading: getKindergartensLoading } = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setPopularProperties(data?.getKindergartens?.list ?? []);
		},
	});

	/** HANDLERS **/

	if (!popularProperties) return null;

	const renderEmptyState = (message: string) => (
		<Box component={'div'} className={'homepage-empty-state'}>
			<p>{message}</p>
			<Link href={'/property'}>Explore all kindergartens</Link>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'popular-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Popular Kindergartens</span>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading popular kindergartens...</p>
							</Box>
						) : popularProperties.length === 0 ? (
							renderEmptyState('Popular kindergartens will appear as families browse.')
						) : (
							<Swiper
								className={'popular-property-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={25}
								modules={[Autoplay]}
							>
								{popularProperties.map((property: Property) => {
									return (
										<SwiperSlide key={property._id} className={'popular-property-slide'}>
											<PopularPropertyCard property={property} />
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
			<Stack className={'popular-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Popular Kindergartens</span>
							<p>Most viewed by parents this week</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'more-box'}>
								<Link href={'/property'}>
									<span>See All Kindergartens</span>
								</Link>
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading popular kindergartens...</p>
							</Box>
						) : popularProperties.length === 0 ? (
							renderEmptyState('Popular kindergartens will appear as families browse.')
						) : (
							<Swiper
								className={'popular-property-swiper'}
								slidesPerView={'auto'}
								spaceBetween={25}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-popular-next',
									prevEl: '.swiper-popular-prev',
								}}
								pagination={{
									el: '.swiper-popular-pagination',
								}}
							>
								{popularProperties.map((property: Property) => {
									return (
										<SwiperSlide key={property._id} className={'popular-property-slide'}>
											<PopularPropertyCard property={property} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
					<Stack className={'pagination-box'}>
						<WestIcon className={'swiper-popular-prev'} />
						<div className={'swiper-popular-pagination'}></div>
						<EastIcon className={'swiper-popular-next'} />
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

PopularProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'kindergartenViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularProperties;
