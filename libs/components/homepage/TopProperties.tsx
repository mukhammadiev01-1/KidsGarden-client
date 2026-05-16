import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import TopPropertyCard from './TopPropertyCard';
import { PropertiesInquiry } from '../../types/property/property.input';
import { Property } from '../../types/property/property';
import { useMutation, useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../../apollo/user/query';
import { LIKE_TARGET_KINDERGARTEN } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface TopPropertiesProps {
	initialInput: PropertiesInquiry;
}

const TopProperties = (props: TopPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topProperties, setTopProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);
	const { loading: getKindergartensLoading, refetch: getKindergartensRefetch } = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTopProperties(data?.getKindergartens?.list ?? []);
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

	const renderEmptyState = (message: string) => (
		<Box component={'div'} className={'homepage-empty-state'}>
			<p>{message}</p>
			<Link href={'/property'}>Explore all kindergartens</Link>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top Kindergartens</span>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading top kindergartens...</p>
							</Box>
						) : topProperties.length === 0 ? (
							renderEmptyState('Top kindergartens will appear as centers gain activity.')
						) : (
							<Swiper
								className={'top-property-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{topProperties.map((property: Property) => {
									return (
										<SwiperSlide className={'top-property-slide'} key={property?._id}>
											<TopPropertyCard property={property} likePropertyHandler={likeKindergartenHandler} />
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
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Top Kindergartens</span>
							<p>Trusted centers with strong parent interest</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{getKindergartensLoading ? (
							<Box component={'div'} className={'homepage-empty-state'}>
								<p>Loading top kindergartens...</p>
							</Box>
						) : topProperties.length === 0 ? (
							renderEmptyState('Top kindergartens will appear as centers gain activity.')
						) : (
							<Swiper
								className={'top-property-swiper'}
								slidesPerView={'auto'}
								spaceBetween={15}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-top-next',
									prevEl: '.swiper-top-prev',
								}}
								pagination={{
									el: '.swiper-top-pagination',
								}}
							>
								{topProperties.map((property: Property) => {
									return (
										<SwiperSlide className={'top-property-slide'} key={property?._id}>
											<TopPropertyCard property={property} likePropertyHandler={likeKindergartenHandler} />
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

TopProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'kindergartenRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopProperties;
