import React, { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Menu, MenuItem, Pagination, Stack, Typography } from '@mui/material';
import KindergartenCard, { formatDistanceAway } from '../property/KindergartenCard';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import withLayoutBasic from '../layout/LayoutBasic';
import Filter from '../property/Filter';
import { useRouter } from 'next/router';
import {
	KindergartensInquiry,
	NearbyKindergartensByAddressInput,
	NearbyKindergartensInput,
} from '../../types/kindergarten/kindergarten.input';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction } from '../../enums/common.enum';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
	GET_KINDERGARTENS,
	GET_NEARBY_KINDERGARTENS,
	GET_NEARBY_KINDERGARTENS_BY_ADDRESS,
} from '../../../apollo/user/query';
import { LIKE_TARGET_KINDERGARTEN } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetLoginConfirmAlert } from '../../sweetAlert';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import Link from 'next/link';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { getImageUrl } from '../../config';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../utils';
import NaverKindergartenListMap from '../maps/NaverKindergartenListMap';

type ListingView = 'grid' | 'list';
type MapPresetKey = 'all' | 'trending' | 'popular' | 'topRank';
type NearbyMode = 'none' | 'location' | 'address';
type NearbyStatus = 'idle' | 'locating' | 'loading' | 'active' | 'error';

interface NearbyLocation {
	latitude: number;
	longitude: number;
}

interface MapPreset {
	key: MapPresetKey;
	label: string;
	sort: string;
	direction: Direction;
}

const mapPresetTabs: MapPreset[] = [
	{ key: 'all', label: 'All', sort: 'createdAt', direction: Direction.DESC },
	{ key: 'trending', label: 'Trending', sort: 'kindergartenViews', direction: Direction.DESC },
	{ key: 'popular', label: 'Popular', sort: 'kindergartenLikes', direction: Direction.DESC },
	{ key: 'topRank', label: 'Top Rated', sort: 'kindergartenRank', direction: Direction.DESC },
];

const nearbyRadiusOptions = [
	{ label: '1 km', value: 1000 },
	{ label: '3 km', value: 3000 },
	{ label: '5 km', value: 5000 },
	{ label: '10 km', value: 10000 },
	{ label: '30 km', value: 30000 },
];

const getActivePresetKey = (filter: KindergartensInquiry): MapPresetKey | null => {
	const sort = filter?.sort || 'createdAt';
	const direction = filter?.direction || Direction.DESC;
	const activePreset = mapPresetTabs.find((preset) => preset.sort === sort && preset.direction === direction);

	return activePreset?.key ?? null;
};

const getSortLabel = (filter: KindergartensInquiry): string => {
	const sort = filter?.sort || 'createdAt';
	const direction = filter?.direction || Direction.DESC;
	const preset = mapPresetTabs.find((item) => item.sort === sort && item.direction === direction);

	if (preset) return preset.key === 'all' ? 'New' : preset.label;
	if (sort === 'monthlyFee' && direction === Direction.ASC) return 'Lowest Fee';
	if (sort === 'monthlyFee' && direction === Direction.DESC) return 'Highest Fee';

	return 'Sort';
};

const countActiveFilters = (filter: KindergartensInquiry): number => {
	const search = filter?.search || {};
	let count = 0;

	if (typeof search.text === 'string' && search.text.trim()) count += 1;
	count += search.locationList?.length || 0;
	count += search.typeList?.length || 0;
	count += search.programsList?.length || 0;
	count += search.ageRangeList?.length || 0;

	const capacityRange = search.capacityRange;
	if (
		capacityRange &&
		(Number(capacityRange.start ?? 0) !== 0 || Number(capacityRange.end ?? 500) !== 500)
	) {
		count += 1;
	}

	const monthlyFeeRange = search.monthlyFeeRange || search.pricesRange;
	if (
		monthlyFeeRange &&
		(Number(monthlyFeeRange.start ?? 0) !== 0 || Number(monthlyFeeRange.end ?? 2000000) !== 2000000)
	) {
		count += 1;
	}

	return count;
};

const KindergartensPage: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [searchFilter, setSearchFilter] = useState<KindergartensInquiry>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);
	const [kindergartens, setKindergartens] = useState<Kindergarten[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [sortingOpen, setSortingOpen] = useState(false);
	const [filterSortName, setFilterSortName] = useState('New');
	const [listingView, setListingView] = useState<ListingView>('grid');
	const [filtersVisible, setFiltersVisible] = useState(true);
	const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
	const [filtersDrawerLayout, setFiltersDrawerLayout] = useState(device !== 'desktop');
	const [nearbyMode, setNearbyMode] = useState<NearbyMode>('none');
	const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('idle');
	const [nearbyError, setNearbyError] = useState('');
	const [nearbyLocation, setNearbyLocation] = useState<NearbyLocation | null>(null);
	const [nearbySearchCenter, setNearbySearchCenter] = useState<NearbyLocation | null>(null);
	const [nearbyAddress, setNearbyAddress] = useState('');
	const [activeNearbyAddress, setActiveNearbyAddress] = useState('');
	const [activeResolvedAddress, setActiveResolvedAddress] = useState('');
	const [nearbyRadiusMeters, setNearbyRadiusMeters] = useState(5000);
	const listingBasePath = router.pathname.startsWith('/kindergartens') ? '/kindergartens' : '/property';
	const activeFilterCount = countActiveFilters(searchFilter);
	const filterToggleLabel =
		filtersVisible && !filtersDrawerLayout
			? 'Hide filters'
			: `Filters${activeFilterCount ? ` (${activeFilterCount})` : ''}`;

	const getListingHref = (input: KindergartensInquiry) => `${listingBasePath}?input=${JSON.stringify(input)}`;

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);

	const {
		loading: getKindergartensLoading,
		refetch: getKindergartensRefetch,
	} = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: any) => {
			if (nearbyMode !== 'none') return;
			setKindergartens(data?.getKindergartens?.list || []);
			setTotal(data?.getKindergartens?.metaCounter?.[0]?.total || 0);
		},
	});

	const [loadNearbyKindergartens, { loading: nearbyQueryLoading }] = useLazyQuery(GET_NEARBY_KINDERGARTENS, {
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: any) => {
			setKindergartens(data?.getNearbyKindergartens?.list || []);
			setTotal(data?.getNearbyKindergartens?.metaCounter?.[0]?.total || 0);
			setNearbyMode('location');
			setNearbyStatus('active');
			setNearbyError('');
			setCurrentPage(1);
		},
		onError: () => {
			setNearbyStatus('error');
			setNearbyError('Could not load nearby kindergartens.');
		},
	});

	const [loadNearbyKindergartensByAddress, { loading: nearbyAddressQueryLoading }] = useLazyQuery(
		GET_NEARBY_KINDERGARTENS_BY_ADDRESS,
		{
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
			onCompleted: (data: any) => {
				const response = data?.getNearbyKindergartensByAddress;
				const searchCenterLatitude = Number(response?.searchCenterLatitude);
				const searchCenterLongitude = Number(response?.searchCenterLongitude);
				const hasSearchCenter = Number.isFinite(searchCenterLatitude) && Number.isFinite(searchCenterLongitude);

				setKindergartens(response?.list || []);
				setTotal(response?.metaCounter?.[0]?.total || 0);
				setNearbyMode('address');
				setNearbyStatus('active');
				setNearbyError('');
				setNearbyLocation(null);
				setNearbySearchCenter(
					hasSearchCenter
						? {
								latitude: searchCenterLatitude,
								longitude: searchCenterLongitude,
						  }
						: null,
				);
				setActiveResolvedAddress(response?.resolvedAddress || response?.searchAddress || '');
				setCurrentPage(1);
			},
			onError: () => {
				setNearbyStatus('error');
				setNearbyError('Could not search this address. Please try a more specific address.');
			},
		},
	);

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) {
			const inputObj = JSON.parse(router?.query?.input as string);
			setSearchFilter(inputObj);
		}

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]);

	useEffect(() => {
		getKindergartensRefetch({ input: searchFilter }).then();
	}, [searchFilter]);

	useEffect(() => {
		setFilterSortName(getSortLabel(searchFilter));
	}, [searchFilter.sort, searchFilter.direction]);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const mediaQuery = window.matchMedia('(max-width: 1180px)');
		const updateFilterLayout = () => setFiltersDrawerLayout(mediaQuery.matches);
		updateFilterLayout();

		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', updateFilterLayout);
			return () => mediaQuery.removeEventListener('change', updateFilterLayout);
		}

		mediaQuery.addListener(updateFilterLayout);
		return () => mediaQuery.removeListener(updateFilterLayout);
	}, []);

	/** HANDLERS **/
	const resetNearbyState = () => {
		setNearbyMode('none');
		setNearbyStatus('idle');
		setNearbyError('');
		setNearbyLocation(null);
		setNearbySearchCenter(null);
		setActiveNearbyAddress('');
		setActiveResolvedAddress('');
	};

	const filterChangeHandler = () => {
		resetNearbyState();
	};

	const filterToggleHandler = () => {
		if (filtersDrawerLayout) {
			setFiltersDrawerOpen(true);
			return;
		}

		setFiltersVisible((prev) => !prev);
	};

	const clearFiltersHandler = async () => {
		resetNearbyState();
		setFiltersDrawerOpen(false);
		setSearchFilter(initialInput);
		setCurrentPage(1);
		const href = getListingHref(initialInput);
		await router.push(href, href, { scroll: false });
	};

	const fetchNearbyKindergartens = async (location: NearbyLocation, radiusMeters: number) => {
		const input: NearbyKindergartensInput = {
			latitude: location.latitude,
			longitude: location.longitude,
			radiusMeters,
		};

		setNearbyStatus('loading');
		await loadNearbyKindergartens({ variables: { input } });
	};

	const fetchNearbyKindergartensByAddress = async (address: string, radiusMeters: number) => {
		const input: NearbyKindergartensByAddressInput = {
			address,
			radiusMeters,
		};

		setNearbyStatus('loading');
		await loadNearbyKindergartensByAddress({ variables: { input } });
	};

	const getGeolocationErrorMessage = (error?: GeolocationPositionError): string => {
		if (!error) return 'Could not detect your location.';
		if (error.code === error.PERMISSION_DENIED) return 'Location permission was denied.';
		if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
			return 'Could not detect your location.';
		}

		return 'Could not detect your location.';
	};

	const nearbySearchHandler = () => {
		if (typeof window === 'undefined') return;

		if (!navigator.geolocation) {
			setNearbyMode('none');
			setNearbyStatus('error');
			setNearbyError('Geolocation is not supported by this browser.');
			return;
		}

		setNearbyStatus('locating');
		setNearbyError('');

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const location = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				};

				setNearbyLocation(location);
				setNearbySearchCenter(null);
				setActiveNearbyAddress('');
				setActiveResolvedAddress('');
				fetchNearbyKindergartens(location, nearbyRadiusMeters).catch(() => {
					setNearbyStatus('error');
					setNearbyError('Could not load nearby kindergartens.');
				});
			},
			(error) => {
				setNearbyMode('none');
				setNearbyStatus('error');
				setNearbyError(getGeolocationErrorMessage(error));
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
		);
	};

	const addressNearbySearchHandler = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const address = nearbyAddress.trim();

		if (!address) {
			setNearbyStatus('error');
			setNearbyError('Please enter an address.');
			return;
		}

		setActiveNearbyAddress(address);
		setNearbyLocation(null);
		setNearbySearchCenter(null);
		setActiveResolvedAddress('');
		fetchNearbyKindergartensByAddress(address, nearbyRadiusMeters).catch(() => {
			setNearbyStatus('error');
			setNearbyError('Could not search this address. Please try a more specific address.');
		});
	};

	const nearbyRadiusChangeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
		const nextRadius = Number(event.target.value);
		setNearbyRadiusMeters(nextRadius);

		if (nearbyMode === 'location' && nearbyLocation) {
			fetchNearbyKindergartens(nearbyLocation, nextRadius).catch(() => {
				setNearbyStatus('error');
				setNearbyError('Could not load nearby kindergartens.');
			});
			return;
		}

		if (nearbyMode === 'address' && activeNearbyAddress) {
			fetchNearbyKindergartensByAddress(activeNearbyAddress, nextRadius).catch(() => {
				setNearbyStatus('error');
				setNearbyError('Could not search this address. Please try a more specific address.');
			});
		}
	};

	const clearNearbyModeHandler = async () => {
		resetNearbyState();
		const result = await getKindergartensRefetch({ input: searchFilter });
		setKindergartens(result?.data?.getKindergartens?.list || []);
		setTotal(result?.data?.getKindergartens?.metaCounter?.[0]?.total || 0);
	};

	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		resetNearbyState();
		const nextFilter = { ...searchFilter, page: value };
		const href = getListingHref(nextFilter);
		setSearchFilter(nextFilter);
		await router.push(href, href, { scroll: false });
		setCurrentPage(value);
	};

	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = async (e: React.MouseEvent<HTMLLIElement>) => {
		resetNearbyState();
		let nextFilter = searchFilter;

		switch (e.currentTarget.id) {
			case 'new':
				nextFilter = { ...searchFilter, page: 1, sort: 'createdAt', direction: Direction.DESC };
				setFilterSortName('New');
				break;
			case 'lowest':
				nextFilter = { ...searchFilter, page: 1, sort: 'monthlyFee', direction: Direction.ASC };
				setFilterSortName('Lowest Fee');
				break;
			case 'highest':
				nextFilter = { ...searchFilter, page: 1, sort: 'monthlyFee', direction: Direction.DESC };
				setFilterSortName('Highest Fee');
				break;
			default:
				break;
		}
		const href = getListingHref(nextFilter);
		setSearchFilter(nextFilter);
		setCurrentPage(1);
		setSortingOpen(false);
		setAnchorEl(null);
		await router.push(href, href, { scroll: false });
	};

	const mapPresetClickHandler = async (preset: MapPreset) => {
		resetNearbyState();
		const nextFilter = {
			...searchFilter,
			page: 1,
			sort: preset.sort,
			direction: preset.direction,
		};
		const href = getListingHref(nextFilter);

		setSearchFilter(nextFilter);
		setCurrentPage(1);
		await router.push(href, href, { scroll: false });
	};

	const topKindergartens = kindergartens.slice(0, 4);
	const activePresetKey = getActivePresetKey(searchFilter);
	const nearbyActive = nearbyMode !== 'none';
	const nearbyLoading =
		nearbyStatus === 'locating' || nearbyStatus === 'loading' || nearbyQueryLoading || nearbyAddressQueryLoading;
	const nearbyRadiusLabel = nearbyRadiusOptions.find((option) => option.value === nearbyRadiusMeters)?.label || '5 km';
	const nearbyCountLabel =
		nearbyMode === 'address'
			? `${total || kindergartens.length} kindergarten${(total || kindergartens.length) === 1 ? '' : 's'} found near this address within ${nearbyRadiusLabel}`
			: `${total || kindergartens.length} nearby kindergarten${(total || kindergartens.length) === 1 ? '' : 's'} found within ${nearbyRadiusLabel}`;
	const listingCountLabel = nearbyActive
		? nearbyCountLabel
		: `${total || kindergartens.length} kindergartens found in this area`;
	const activeSearchLocationLabel = activeResolvedAddress || activeNearbyAddress;
	const noKindergartensTitle =
		nearbyMode === 'address'
			? `No kindergartens found near this address within ${nearbyRadiusLabel}.`
			: nearbyMode === 'location'
			? `No kindergartens found near your location within ${nearbyRadiusLabel}.`
			: 'No kindergartens found yet.';
	const noKindergartensText =
		nearbyMode === 'address'
			? 'Try a larger radius or another area.'
			: nearbyMode === 'location'
			? 'Try a larger radius or show all kindergartens.'
			: 'Try adjusting your filters or check back soon.';

	const likeKindergartenHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert('Please login first');
				if (confirmed) await router.push('/account/join');
				return;
			}
			await likeTargetKindergarten({ variables: { input: id } });
			if (nearbyMode === 'location' && nearbyLocation) {
				await fetchNearbyKindergartens(nearbyLocation, nearbyRadiusMeters);
			} else if (nearbyMode === 'address' && activeNearbyAddress) {
				await fetchNearbyKindergartensByAddress(activeNearbyAddress, nearbyRadiusMeters);
			} else {
				await getKindergartensRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const renderKindergartenListRow = (kindergarten: Kindergarten) => {
		const kindergartenImageUrl = getImageUrl(kindergarten?.kindergartenImages?.[0]);
		const location = kindergarten?.kindergartenLocation || kindergarten?.kindergartenAddress || 'Location pending';
		const description = kindergarten?.kindergartenDesc?.trim();
		const kindergartenTypeLabel = getKindergartenTypeLabel(kindergarten?.kindergartenType);
		const isLiked = Boolean(kindergarten?.meLiked?.[0]?.myFavorite);
		const distanceLabel = formatDistanceAway(kindergarten?.distanceMeters);
		const detailHref = {
			pathname: '/kindergartens/detail',
			query: { id: kindergarten?._id },
		};
		const metaItems = [
			kindergarten?.kindergartenAgeRange ? `Ages ${kindergarten.kindergartenAgeRange}` : '',
			kindergarten?.kindergartenCapacity ? `${kindergarten.kindergartenCapacity} capacity` : '',
			kindergarten?.kindergartenPrograms ? `${kindergarten.kindergartenPrograms} programs` : '',
		].filter(Boolean);

		return (
			<Stack className="kg-list-card" key={kindergarten?._id}>
				<Link className="kg-list-card-image" href={detailHref}>
					<img src={kindergartenImageUrl} alt={kindergarten?.kindergartenTitle || 'Kindergarten'} />
				</Link>
				<Stack className="kg-list-card-main">
					<Stack className="kg-list-title-row">
						<Link href={detailHref}>
							<Typography component="h3">{kindergarten?.kindergartenTitle || 'Kindergarten'}</Typography>
						</Link>
						<button
							type="button"
							className={`kg-list-like ${isLiked ? 'active' : ''}`}
							aria-label="Like kindergarten"
							onClick={() => likeKindergartenHandler(user, kindergarten?._id || '')}
						>
							{isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
						</button>
					</Stack>
					<Typography className="kg-list-location">
						<LocationOnOutlinedIcon />
						{location}
					</Typography>
					{distanceLabel && (
						<span className="kg-list-distance">
							<NearMeRoundedIcon />
							{distanceLabel}
						</span>
					)}
					{description && <Typography className="kg-list-description">{description}</Typography>}
					<Stack className="kg-list-meta">
						{kindergartenTypeLabel && <span>{kindergartenTypeLabel}</span>}
						{metaItems.map((item) => (
							<span key={item}>{item}</span>
						))}
					</Stack>
					<Stack className="kg-list-stats">
						<span>
							<StarRoundedIcon /> {kindergarten?.kindergartenRank || 0} rank
						</span>
						<span>{kindergarten?.kindergartenViews || 0} views</span>
						<span>{kindergarten?.kindergartenLikes || 0} likes</span>
					</Stack>
				</Stack>
				<Stack className="kg-list-card-side">
					<span className="kg-list-status">{kindergarten?.kindergartenStatus}</span>
					<strong>{formatMonthlyFee(kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice)}</strong>
					<Link className="kg-list-details" href={detailHref}>
						View Details
					</Link>
				</Stack>
			</Stack>
		);
	};

	return (
		<div id="kindergartens-list-page" style={{ position: 'relative' }}>
			<Stack className="kg-kindergarten-hero">
				<Box component="div" className="kg-kindergarten-hero-inner">
					<Stack className="kg-kindergarten-hero-copy">
						<Typography component="h1">Find the right kindergarten for your child</Typography>
						<Typography className="kg-kindergarten-hero-subtitle">
							Discover trusted centers, caring teachers, and safe spaces near you.
						</Typography>
						<Stack className="kg-trust-chips">
							<span>
								<VerifiedRoundedIcon /> Verified centers
							</span>
							<span>
								<ShieldOutlinedIcon /> Safe care
							</span>
							<span>
								<RateReviewOutlinedIcon /> Parent reviews
							</span>
						</Stack>
					</Stack>
					<Box component="div" className="kg-kindergarten-hero-visual">
						<div className="kg-hero-photo" />
						<div className="kg-hero-leaf kg-hero-leaf-one" />
						<div className="kg-hero-leaf kg-hero-leaf-two" />
					</Box>
				</Box>
			</Stack>

			<div className="container kg-kindergarten-container">
				<Stack className={`kg-nearby-panel ${nearbyActive ? 'active' : ''}`}>
					<Stack className="kg-nearby-copy">
						<span>
							<MyLocationRoundedIcon /> Nearby search
						</span>
						<strong>Find kindergartens near you</strong>
						<p>Use your location or search by address. Nothing is saved.</p>
					</Stack>
					<Stack className="kg-nearby-actions">
						<form className="kg-address-search" onSubmit={addressNearbySearchHandler}>
							<label>
								Address or area
								<input
									type="text"
									value={nearbyAddress}
									onChange={(event) => setNearbyAddress(event.target.value)}
									placeholder="Enter your address or area"
									disabled={nearbyLoading}
								/>
							</label>
							<Button className="kg-address-button" type="submit" disabled={nearbyLoading}>
								{nearbyLoading && nearbyMode === 'address' ? 'Searching...' : 'Search by address'}
							</Button>
						</form>
						<label className="kg-radius-control">
							Radius
							<select value={nearbyRadiusMeters} onChange={nearbyRadiusChangeHandler} disabled={nearbyLoading}>
								{nearbyRadiusOptions.map((option) => (
									<option value={option.value} key={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</label>
						<Button
							className="kg-nearby-button"
							onClick={nearbySearchHandler}
							disabled={nearbyLoading}
							startIcon={<NearMeRoundedIcon />}
						>
							{nearbyLoading ? 'Finding...' : 'Use my location'}
						</Button>
						{nearbyActive && (
							<Button className="kg-nearby-reset" onClick={clearNearbyModeHandler} disabled={nearbyLoading}>
								Show all kindergartens
							</Button>
						)}
					</Stack>
					{nearbyMode === 'address' && activeSearchLocationLabel && (
						<div className="kg-nearby-active-note">Searching near: {activeSearchLocationLabel}</div>
					)}
					{nearbyError && <div className="kg-nearby-error">{nearbyError}</div>}
				</Stack>

				<Stack className="kg-map-preview kg-map-preview-live">
					<Stack className="kg-map-tabs">
						{mapPresetTabs.map((preset) => (
							<button
								type="button"
								key={preset.key}
								className={activePresetKey === preset.key ? 'active' : ''}
								aria-pressed={activePresetKey === preset.key}
								onClick={() => mapPresetClickHandler(preset)}
							>
								{preset.label}
							</button>
						))}
					</Stack>
					<Box component="div" className="kg-map-count">
						{listingCountLabel}
					</Box>
					<NaverKindergartenListMap
						kindergartens={kindergartens}
						userLocation={nearbyMode === 'location' ? nearbyLocation : null}
						searchLocation={nearbyMode === 'address' ? nearbySearchCenter : null}
						searchLocationLabel={activeSearchLocationLabel}
						onLocateMe={nearbySearchHandler}
						locateMeDisabled={nearbyLoading}
					/>
				</Stack>

				<Stack className="kg-filter-control-row">
					<Button
						className={`kg-filter-toggle ${
							(filtersVisible && !filtersDrawerLayout) || filtersDrawerOpen ? 'active' : ''
						}`}
						onClick={filterToggleHandler}
					>
						<FilterListRoundedIcon />
						{filterToggleLabel}
					</Button>
					{activeFilterCount > 0 && (
						<Button className="kg-filter-clear" onClick={clearFiltersHandler}>
							Clear filters
						</Button>
					)}
				</Stack>

				<Stack className={`kindergartens-page kg-listing-area ${filtersVisible ? 'kg-filters-open' : 'kg-filters-closed'}`}>
					{filtersVisible && (
						<Stack className={'filter-config'}>
							{/* @ts-ignore */}
							<Filter
								searchFilter={searchFilter}
								setSearchFilter={setSearchFilter}
								initialInput={initialInput}
								onFilterChange={filterChangeHandler}
							/>
						</Stack>
					)}
					<Stack className="main-config" mb={device === 'mobile' ? '42px' : '76px'}>
						<Stack className="kg-listing-toolbar">
							<Typography component="h2">Showing kindergartens</Typography>
							<Stack className="kg-listing-actions">
								<Box component={'div'} className={'right'}>
									<span>Sort by</span>
									<div>
										<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
											{filterSortName}
										</Button>
										<Menu
											anchorEl={anchorEl}
											open={sortingOpen}
											onClose={sortingCloseHandler}
											sx={{ paddingTop: '5px' }}
										>
											<MenuItem onClick={sortingHandler} id={'new'} disableRipple>
												New
											</MenuItem>
											<MenuItem onClick={sortingHandler} id={'lowest'} disableRipple>
												Lowest Fee
											</MenuItem>
											<MenuItem onClick={sortingHandler} id={'highest'} disableRipple>
												Highest Fee
											</MenuItem>
										</Menu>
									</div>
								</Box>
								<Stack className="kg-view-toggle">
									<button
										type="button"
										className={listingView === 'grid' ? 'active' : ''}
										aria-label="Show grid view"
										aria-pressed={listingView === 'grid'}
										onClick={() => setListingView('grid')}
									>
										<GridViewRoundedIcon />
									</button>
									<button
										type="button"
										className={listingView === 'list' ? 'active' : ''}
										aria-label="Show list view"
										aria-pressed={listingView === 'list'}
										onClick={() => setListingView('list')}
									>
										<ViewListRoundedIcon />
									</button>
								</Stack>
							</Stack>
						</Stack>
						<Stack className={`list-config kg-${listingView}-view`}>
							{getKindergartensLoading && kindergartens?.length === 0 ? (
								<div className={'no-data'}>
									<p>Loading kindergartens...</p>
								</div>
							) : kindergartens?.length === 0 ? (
								<div className={'no-data'}>
									<img src="/img/icons/icoAlert.svg" alt="" />
									<p>{noKindergartensTitle}</p>
									<span>{noKindergartensText}</span>
								</div>
							) : (
								kindergartens.map((kindergarten: Kindergarten) => {
									return listingView === 'grid' ? (
										<KindergartenCard
											kindergarten={kindergarten}
											key={kindergarten?._id}
											likeKindergartenHandler={likeKindergartenHandler}
										/>
									) : (
										renderKindergartenListRow(kindergarten)
									);
								})
							)}
						</Stack>
						<Stack className="pagination-config">
							{kindergartens.length !== 0 && !nearbyActive && (
								<Stack className="pagination-box">
									<Pagination
										page={currentPage}
										count={Math.ceil(total / searchFilter.limit)}
										onChange={handlePaginationChange}
										shape="circular"
										color="primary"
									/>
								</Stack>
							)}

							{kindergartens.length !== 0 && (
								<Stack className="total-result">
									<Typography>
										{nearbyActive
											? listingCountLabel
											: `${total} kindergarten${total > 1 ? 's' : ''} found`}
									</Typography>
								</Stack>
							)}
						</Stack>
					</Stack>
				</Stack>

				{filtersDrawerOpen && (
					<div className="kg-filter-drawer-backdrop" onClick={() => setFiltersDrawerOpen(false)}>
						<aside className="kg-filter-drawer" aria-label="Filters" onClick={(event) => event.stopPropagation()}>
							<Stack className="kg-filter-drawer-header">
								<Typography component="h2">Filters</Typography>
								<button type="button" aria-label="Close filters" onClick={() => setFiltersDrawerOpen(false)}>
									<CloseRoundedIcon />
								</button>
							</Stack>
							{activeFilterCount > 0 && (
								<Button className="kg-filter-drawer-clear" onClick={clearFiltersHandler}>
									Clear filters
								</Button>
							)}
							{/* @ts-ignore */}
							<Filter
								searchFilter={searchFilter}
								setSearchFilter={setSearchFilter}
								initialInput={initialInput}
								onFilterChange={filterChangeHandler}
							/>
						</aside>
					</div>
				)}

				{topKindergartens.length > 0 && (
					<Stack className="kg-top-kindergartens">
						<Stack className="kg-top-strip-header">
							<Stack>
								<Typography component="h2">
									<EmojiEventsRoundedIcon /> Top Kindergartens
								</Typography>
								<span>Hand-picked centers loved by families</span>
							</Stack>
							<Link href="/kindergartens">See all top kindergartens</Link>
						</Stack>
						<Stack className="kg-top-strip-list">
							{topKindergartens.map((kindergarten, index) => (
								<Link
									className="kg-top-mini-card"
									href={{ pathname: '/kindergartens/detail', query: { id: kindergarten?._id } }}
									key={kindergarten?._id}
								>
									<div className="rank">{index + 1}</div>
									<img src={getImageUrl(kindergarten?.kindergartenImages?.[0])} alt="" />
									<Stack>
										<strong>{kindergarten?.kindergartenTitle}</strong>
										<span>
											<LocationOnOutlinedIcon />
											{kindergarten?.kindergartenLocation || kindergarten?.kindergartenAddress}
										</span>
									</Stack>
									<em>
										<StarRoundedIcon /> {kindergarten?.kindergartenRank || kindergarten?.kindergartenLikes || 0}
									</em>
								</Link>
							))}
						</Stack>
					</Stack>
				)}
			</div>
			<style jsx global>{`
				#kindergartens-list-page {
					overflow-x: hidden;
				}

				#kindergartens-list-page .kg-kindergarten-hero-inner,
				#kindergartens-list-page .container.kg-kindergarten-container {
					width: min(1280px, calc(100vw - 32px)) !important;
					max-width: calc(100vw - 32px) !important;
					min-width: 0 !important;
					box-sizing: border-box;
				}

				#kindergartens-list-page .container.kg-kindergarten-container {
					margin: 0 auto !important;
					padding: 0 !important;
				}

				#kindergartens-list-page .kg-nearby-panel,
				#kindergartens-list-page .kg-map-preview,
				#kindergartens-list-page .kg-listing-area.kindergartens-page,
				#kindergartens-list-page .kg-top-kindergartens {
					width: 100% !important;
					max-width: 100% !important;
					min-width: 0 !important;
					box-sizing: border-box;
				}

				#kindergartens-list-page .kg-kindergarten-hero-copy,
				#kindergartens-list-page .kg-kindergarten-hero-copy h1,
				#kindergartens-list-page .kg-kindergarten-hero-copy .kg-kindergarten-hero-subtitle,
				#kindergartens-list-page .kg-kindergarten-hero-copy .kg-trust-chips,
				#kindergartens-list-page .kg-kindergarten-hero-visual {
					max-width: calc(100vw - 48px) !important;
					min-width: 0 !important;
					box-sizing: border-box;
				}

				#kindergartens-list-page .kg-kindergarten-hero-copy h1,
				#kindergartens-list-page .kg-kindergarten-hero-copy .kg-kindergarten-hero-subtitle {
					white-space: normal !important;
					overflow-wrap: anywhere !important;
				}

				#kindergartens-list-page .kg-nearby-panel {
					margin: 0 auto 20px;
					padding: 18px 20px;
					display: grid !important;
					grid-template-columns: minmax(220px, 258px) minmax(0, 1fr);
					align-items: center;
					gap: 24px;
					border: 1px solid #dfead6;
					border-radius: 24px;
					background: linear-gradient(135deg, #fbfff6 0%, #fffaf0 100%);
					box-shadow: 0 14px 34px rgba(42, 105, 60, 0.08);
				}

				#kindergartens-list-page .kg-nearby-panel.active {
					border-color: #b9dca9;
					box-shadow: 0 18px 40px rgba(42, 105, 60, 0.12);
				}

				#kindergartens-list-page .kg-nearby-copy {
					min-width: 0;
					max-width: 258px;
					gap: 7px;
					padding: 1px 0;
				}

				#kindergartens-list-page .kg-nearby-copy span {
					display: inline-flex;
					align-items: center;
					gap: 7px;
					color: #2f7d4a;
					font-size: 11px;
					font-weight: 850;
					text-transform: uppercase;
					letter-spacing: 0.04em;
				}

				#kindergartens-list-page .kg-nearby-copy span svg {
					width: 16px;
					height: 16px;
				}

				#kindergartens-list-page .kg-nearby-copy strong {
					color: #24362a;
					font-size: 19px;
					font-weight: 850;
					line-height: 24px;
				}

				#kindergartens-list-page .kg-nearby-copy p {
					margin: 0;
					color: #66746a;
					font-size: 13px;
					font-weight: 650;
					line-height: 19px;
				}

				#kindergartens-list-page .kg-nearby-actions {
					width: 100%;
					min-width: 0;
					display: grid !important;
					grid-template-columns: 142px 174px minmax(0, 1fr) auto;
					align-items: end;
					gap: 12px;
				}

				#kindergartens-list-page .kg-address-search {
					grid-column: 1 / -1;
					width: 100%;
					min-width: 0;
					display: grid;
					grid-template-columns: minmax(0, 1fr) 154px;
					align-items: end;
					gap: 10px;
				}

				#kindergartens-list-page .kg-nearby-actions label {
					display: flex;
					flex-direction: column;
					gap: 6px;
					color: #526252;
					font-size: 11px;
					font-weight: 800;
				}

				#kindergartens-list-page .kg-address-search label {
					min-width: 0;
				}

				#kindergartens-list-page .kg-radius-control {
					grid-column: 1;
					width: 142px;
					min-width: 0;
				}

				#kindergartens-list-page .kg-nearby-actions input,
				#kindergartens-list-page .kg-nearby-actions select {
					height: 40px;
					min-width: 0;
					padding: 0 34px 0 12px;
					border: 1px solid #d8e5cf;
					border-radius: 13px;
					background: #fff;
					color: #26382b;
					font-size: 14px;
					font-weight: 750;
					outline: none;
				}

				#kindergartens-list-page .kg-nearby-actions input {
					width: 100%;
					min-width: 0;
					padding-right: 13px;
				}

				#kindergartens-list-page .kg-nearby-actions select:focus-visible,
				#kindergartens-list-page .kg-nearby-actions input:focus-visible,
				#kindergartens-list-page .kg-nearby-actions button:focus-visible {
					outline: 3px solid rgba(47, 125, 74, 0.24);
					outline-offset: 2px;
				}

				#kindergartens-list-page .kg-radius-control select {
					width: 100%;
				}

				#kindergartens-list-page .kg-address-button {
					height: 40px;
					width: 154px;
					padding: 0 13px;
					border: 1px solid #c9dfbd;
					border-radius: 13px;
					background: #fff;
					color: #23823f;
					font-size: 13px;
					font-weight: 850;
					text-transform: none;
					white-space: nowrap;
				}

				#kindergartens-list-page .kg-address-button:hover {
					background: #f4fbef;
				}

				#kindergartens-list-page .kg-nearby-button {
					grid-column: 2;
					height: 40px;
					width: 174px;
					min-width: 0;
					max-width: 174px;
					justify-self: start;
					padding: 0 14px;
					border-radius: 13px;
					background: #23823f;
					color: #fff;
					font-size: 13px;
					font-weight: 850;
					text-transform: none;
					white-space: nowrap;
					box-shadow: 0 10px 20px rgba(35, 130, 63, 0.18);
				}

				#kindergartens-list-page .kg-nearby-button:hover {
					background: #1b6e34;
				}

				#kindergartens-list-page .kg-nearby-reset {
					height: 40px;
					width: fit-content;
					grid-column: 4;
					justify-self: end;
					padding: 0 15px;
					border: 1px solid #d8e5cf;
					border-radius: 13px;
					background: #fff;
					color: #2f7d4a;
					font-size: 13px;
					font-weight: 850;
					text-transform: none;
				}

				#kindergartens-list-page .kg-nearby-active-note {
					grid-column: 2;
					color: #2f7d4a;
					font-size: 12px;
					font-weight: 800;
					line-height: 17px;
				}

				#kindergartens-list-page .kg-nearby-error {
					grid-column: 1 / -1;
					padding: 10px 12px;
					border-radius: 14px;
					background: #fff4ed;
					color: #a24f1d;
					font-size: 13px;
					font-weight: 900;
				}

				#kindergartens-list-page .kg-map-tabs button,
				#kindergartens-list-page .kg-view-toggle button {
					border: 0;
					font: inherit;
					cursor: pointer;
					appearance: none;
				}

				#kindergartens-list-page .kg-map-tabs button {
					padding: 8px 14px;
					border-radius: 999px;
					background: rgba(255, 255, 255, 0.86);
					color: #26382b;
					font-weight: 900;
					box-shadow: 0 8px 18px rgba(32, 79, 43, 0.08);
				}

				#kindergartens-list-page .kg-map-tabs button.active {
					background: #2f7d4a;
					color: #fff;
				}

				#kindergartens-list-page .kg-filter-control-row {
					width: 100%;
					display: none !important;
					flex-direction: row !important;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
					margin: 0 0 14px;
				}

				#kindergartens-list-page .kg-filter-toggle,
				#kindergartens-list-page .kg-filter-clear,
				#kindergartens-list-page .kg-filter-drawer-clear {
					height: 38px;
					border-radius: 999px;
					font-size: 13px;
					font-weight: 900;
					text-transform: none;
				}

				#kindergartens-list-page .kg-filter-toggle {
					padding: 0 16px;
					border: 1px solid #d8e6d2;
					background: #ffffff;
					color: #24452d;
					box-shadow: 0 10px 22px rgba(37, 86, 47, 0.08);
				}

				#kindergartens-list-page .kg-filter-toggle svg {
					width: 18px;
					height: 18px;
					margin-right: 6px;
					color: #2f7d4a;
				}

				#kindergartens-list-page .kg-filter-toggle.active {
					border-color: #2f7d4a;
					background: #edf8e7;
					color: #2f7d4a;
				}

				#kindergartens-list-page .kg-filter-clear,
				#kindergartens-list-page .kg-filter-drawer-clear {
					padding: 0 14px;
					border: 1px solid #e7d8c5;
					background: #fff9ef;
					color: #a66312;
				}

				#kindergartens-list-page .kg-filter-toggle:focus-visible,
				#kindergartens-list-page .kg-filter-clear:focus-visible,
				#kindergartens-list-page .kg-filter-drawer button:focus-visible {
					outline: 3px solid rgba(47, 125, 74, 0.24);
					outline-offset: 2px;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page {
					display: flex !important;
					flex-wrap: wrap !important;
					align-items: flex-start !important;
					gap: 18px !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config {
					flex: 0 0 230px !important;
					width: 230px !important;
					max-width: 100% !important;
					min-width: 0 !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .main-config {
					flex: 1 1 0 !important;
					width: auto !important;
					max-width: 100% !important;
					min-width: 0 !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page.kg-filters-closed .main-config {
					flex: 1 1 100% !important;
					width: 100% !important;
				}

				#kindergartens-list-page .kg-filter-drawer-backdrop {
					position: fixed;
					inset: 0;
					z-index: 1600;
					display: flex;
					justify-content: flex-end;
					background: rgba(18, 35, 22, 0.3);
					backdrop-filter: blur(4px);
				}

				#kindergartens-list-page .kg-filter-drawer {
					width: min(380px, calc(100vw - 28px));
					height: 100%;
					padding: 18px;
					overflow-y: auto;
					background: #fffdf8;
					box-shadow: -18px 0 42px rgba(21, 45, 28, 0.18);
					box-sizing: border-box;
				}

				#kindergartens-list-page .kg-filter-drawer-header {
					flex-direction: row;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
					margin-bottom: 14px;
				}

				#kindergartens-list-page .kg-filter-drawer-header h2 {
					margin: 0;
					color: #223328;
					font-size: 22px;
					font-weight: 900;
				}

				#kindergartens-list-page .kg-filter-drawer-header button {
					width: 38px;
					height: 38px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border: 1px solid #dbe8d4;
					border-radius: 13px;
					background: #ffffff;
					color: #2f7d4a;
					cursor: pointer;
				}

				#kindergartens-list-page .kg-filter-drawer .filter-main {
					width: 100%;
					padding: 18px 0 4px;
					border: 0;
					box-shadow: none;
					background: transparent;
				}

				#kindergartens-list-page .kg-filter-drawer-clear {
					width: 100%;
					margin-bottom: 8px;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-toggle {
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 10px;
					padding: 0;
					border: 0;
					background: transparent;
					color: #26382b;
					font: inherit;
					cursor: pointer;
					text-align: left;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-toggle span {
					flex: 1 1 auto;
					color: #26382b;
					font-size: 14px;
					font-weight: 900;
					line-height: 20px;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-toggle em {
					min-width: 22px;
					height: 22px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border-radius: 999px;
					background: #e9f5e4;
					color: #2f7d4a;
					font-size: 11px;
					font-style: normal;
					font-weight: 900;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-toggle svg {
					width: 20px;
					height: 20px;
					color: #6f806f;
					transition: transform 160ms ease;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-toggle.open svg {
					transform: rotate(180deg);
				}

				#kindergartens-list-page .filter-main .kg-filter-section-toggle:focus-visible {
					outline: 3px solid rgba(47, 125, 74, 0.22);
					outline-offset: 4px;
					border-radius: 10px;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-body {
					margin-top: 12px;
				}

				#kindergartens-list-page .filter-main .kg-filter-section-body.kindergarten-location {
					height: auto !important;
					max-height: 260px;
					overflow-y: auto;
				}

				#kindergartens-list-page .kg-view-toggle button {
					width: 34px;
					height: 34px;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 10px;
					background: transparent;
					color: #9ba79a;
				}

				#kindergartens-list-page .kg-view-toggle button.active {
					background: #e9f5e4;
					color: #2f7d4a;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view {
					display: grid !important;
					grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
					gap: 18px !important;
					justify-content: stretch !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-list-view {
					display: flex !important;
					flex-direction: column !important;
					gap: 16px !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .kg-grid-view .card-config {
					width: 100% !important;
					max-width: none !important;
					min-width: 0 !important;
				}

				#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page,
				#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page {
					display: flex !important;
					flex-wrap: wrap !important;
					gap: 18px !important;
				}

				#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config,
				#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config {
					flex: 0 0 230px !important;
					width: 230px !important;
					max-width: 230px !important;
				}

				#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .main-config,
				#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .main-config {
					flex: 1 1 0 !important;
					width: auto !important;
					min-width: 0 !important;
				}

				#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view,
				#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view {
					display: grid !important;
					grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
					gap: 18px !important;
				}

				#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .kg-grid-view .card-config,
				#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .kg-grid-view .card-config {
					width: 100% !important;
					max-width: none !important;
				}

				#kindergartens-list-page .kg-list-card {
					width: 100%;
					min-width: 0;
					display: grid;
					grid-template-columns: 220px minmax(0, 1fr) 180px;
					gap: 20px;
					align-items: stretch;
					padding: 16px;
					border: 1px solid #e1ead9;
					border-radius: 22px;
					background: #fffdf8;
					box-shadow: 0 16px 34px rgba(31, 81, 50, 0.08);
					box-sizing: border-box;
				}

				#kindergartens-list-page .kg-list-card-image {
					display: block;
					min-width: 0;
					height: 166px;
					overflow: hidden;
					border-radius: 18px;
					background: #eef5e9;
				}

				#kindergartens-list-page .kg-list-card-image img {
					width: 100%;
					height: 100%;
					display: block;
					object-fit: cover;
				}

				#kindergartens-list-page .kg-distance-badge {
					position: absolute;
					left: 12px;
					bottom: 12px;
					display: inline-flex;
					align-items: center;
					gap: 5px;
					padding: 7px 10px;
					border-radius: 999px;
					background: rgba(255, 255, 255, 0.94);
					color: #2f7d4a;
					box-shadow: 0 8px 18px rgba(32, 79, 43, 0.14);
				}

				#kindergartens-list-page .kg-distance-badge svg {
					width: 16px;
					height: 16px;
				}

				#kindergartens-list-page .kg-distance-badge p {
					margin: 0;
					font-size: 12px;
					font-weight: 950;
					line-height: 1;
				}

				#kindergartens-list-page .kg-list-card-main {
					min-width: 0;
					gap: 8px;
					justify-content: center;
				}

				#kindergartens-list-page .kg-list-title-row {
					flex-direction: row;
					align-items: flex-start;
					justify-content: space-between;
					gap: 12px;
					min-width: 0;
				}

				#kindergartens-list-page .kg-list-title-row a {
					min-width: 0;
					color: inherit;
					text-decoration: none;
				}

				#kindergartens-list-page .kg-list-title-row h3 {
					margin: 0;
					color: #223328;
					font-size: 20px;
					font-weight: 900;
					line-height: 25px;
				}

				#kindergartens-list-page .kg-list-like {
					width: 34px;
					height: 34px;
					flex: 0 0 auto;
					display: flex;
					align-items: center;
					justify-content: center;
					border: 1px solid #e1ead9;
					border-radius: 50%;
					background: #fff;
					color: #2f7d4a;
					cursor: pointer;
				}

				#kindergartens-list-page .kg-list-like svg {
					width: 19px;
					height: 19px;
				}

				#kindergartens-list-page .kg-list-location {
					display: flex;
					align-items: center;
					gap: 5px;
					margin: 0;
					color: #607064;
					font-size: 13px;
					font-weight: 800;
					line-height: 19px;
				}

				#kindergartens-list-page .kg-list-location svg {
					width: 17px;
					height: 17px;
					color: #2f7d4a;
				}

				#kindergartens-list-page .kg-list-distance {
					width: fit-content;
					display: inline-flex;
					align-items: center;
					gap: 5px;
					padding: 7px 10px;
					border-radius: 999px;
					background: #edf8e7;
					color: #2f7d4a;
					font-size: 12px;
					font-weight: 950;
				}

				#kindergartens-list-page .kg-list-distance svg {
					width: 15px;
					height: 15px;
				}

				#kindergartens-list-page .kg-list-description {
					margin: 0;
					color: #6f7d72;
					font-size: 13px;
					font-weight: 600;
					line-height: 20px;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}

				#kindergartens-list-page .kg-list-meta,
				#kindergartens-list-page .kg-list-stats {
					flex-direction: row;
					flex-wrap: wrap;
					gap: 8px;
				}

				#kindergartens-list-page .kg-list-meta span {
					padding: 7px 10px;
					border-radius: 999px;
					background: #f3f8ef;
					color: #4d654f;
					font-size: 12px;
					font-weight: 800;
				}

				#kindergartens-list-page .kg-list-stats span {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					color: #7a867b;
					font-size: 12px;
					font-weight: 800;
				}

				#kindergartens-list-page .kg-list-stats svg {
					width: 15px;
					height: 15px;
					color: #f5a623;
				}

				#kindergartens-list-page .kg-list-card-side {
					min-width: 0;
					align-items: flex-end;
					justify-content: center;
					gap: 12px;
					text-align: right;
				}

				#kindergartens-list-page .kg-list-status {
					padding: 7px 11px;
					border-radius: 999px;
					background: #e9f5e4;
					color: #2f7d4a;
					font-size: 12px;
					font-weight: 900;
				}

				#kindergartens-list-page .kg-list-card-side strong {
					color: #213d28;
					font-size: 16px;
					font-weight: 950;
					line-height: 22px;
				}

				#kindergartens-list-page .kg-list-details {
					width: 100%;
					padding: 11px 16px;
					border-radius: 999px;
					background: #23823f;
					color: #fff;
					font-size: 13px;
					font-weight: 900;
					text-align: center;
					text-decoration: none;
					box-sizing: border-box;
				}

				#kindergartens-list-page .kg-list-details:hover {
					background: #1b6e34;
				}

				#kindergartens-list-page .kg-top-kindergartens .kg-top-strip-list {
					display: grid !important;
					grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
				}

				#kindergartens-list-page .kg-list-map-user-marker {
					width: 36px;
					height: 36px;
					display: flex;
					align-items: center;
					justify-content: center;
					border: 2px solid #fff;
					border-radius: 999px;
					background: #23823f;
					color: #fff;
					font-size: 11px;
					font-weight: 950;
					box-shadow: 0 8px 18px rgba(32, 79, 43, 0.22);
				}

				#kindergartens-list-page .kg-list-map-search-marker {
					max-width: 168px;
					height: 36px;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0 12px;
					border: 2px solid #fff;
					border-radius: 999px;
					background: #f4a928;
					color: #fff;
					font-size: 11px;
					font-weight: 950;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					box-shadow: 0 8px 18px rgba(153, 96, 12, 0.22);
				}

				#kindergartens-list-page .kg-map-locate-button {
					position: absolute;
					right: 16px;
					bottom: 54px;
					z-index: 5;
					width: 42px;
					height: 42px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border: 1px solid rgba(36, 130, 63, 0.18);
					border-radius: 14px;
					background: rgba(255, 255, 255, 0.96);
					color: #23823f;
					box-shadow: 0 12px 24px rgba(35, 77, 45, 0.18);
					cursor: pointer;
					transition:
						transform 160ms ease,
						box-shadow 160ms ease,
						border-color 160ms ease,
						background 160ms ease;
				}

				#kindergartens-list-page .kg-map-locate-button:hover {
					transform: translateY(-1px);
					border-color: rgba(36, 130, 63, 0.34);
					background: #ffffff;
					box-shadow: 0 16px 28px rgba(35, 77, 45, 0.22);
				}

				#kindergartens-list-page .kg-map-locate-button.active {
					background: #23823f;
					color: #ffffff;
					border-color: #23823f;
				}

				#kindergartens-list-page .kg-map-locate-button:disabled {
					opacity: 0.62;
					cursor: not-allowed;
					transform: none;
					box-shadow: 0 8px 18px rgba(35, 77, 45, 0.12);
				}

				#kindergartens-list-page .kg-map-locate-button:focus-visible {
					outline: 3px solid rgba(35, 130, 63, 0.28);
					outline-offset: 3px;
				}

				@media (max-width: 1180px) {
					#kindergartens-list-page .kg-filter-control-row {
						display: flex !important;
					}

					#kindergartens-list-page .kg-nearby-panel {
						grid-template-columns: 232px minmax(0, 1fr);
						gap: 20px;
					}

					#kindergartens-list-page .kg-nearby-copy {
						max-width: 232px;
					}

					#kindergartens-list-page .kg-nearby-actions {
						grid-template-columns: 132px 166px minmax(0, 1fr) auto;
					}

					#kindergartens-list-page .kg-radius-control {
						width: 132px;
					}

					#kindergartens-list-page .kg-nearby-button {
						width: 166px;
						max-width: 166px;
					}

					#kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config {
						display: none !important;
					}

					#kindergartens-list-page .kg-listing-area.kindergartens-page {
						flex-direction: column !important;
					}

					#kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config,
					#kindergartens-list-page .kg-listing-area.kindergartens-page .main-config {
						width: 100% !important;
						flex: 0 0 auto !important;
					}

					#kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view {
						grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
					}

					#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config,
					#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config,
					#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .main-config,
					#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .main-config {
						width: 100% !important;
						max-width: 100% !important;
						flex: 0 0 auto !important;
					}

					#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view,
					#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view {
						grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
					}
				}

				@media (max-width: 900px) {
					#kindergartens-list-page .kg-nearby-panel {
						grid-template-columns: 1fr;
						align-items: stretch;
					}

					#kindergartens-list-page .kg-nearby-copy {
						max-width: none;
					}

					#kindergartens-list-page .kg-list-card {
						grid-template-columns: 1fr;
					}

					#kindergartens-list-page .kg-list-card-side {
						align-items: flex-start;
						text-align: left;
					}

					#kindergartens-list-page .kg-map-locate-button {
						right: 12px;
						bottom: 48px;
						width: 40px;
						height: 40px;
						border-radius: 13px;
					}
				}

				@media (max-width: 760px) {
					#kindergartens-list-page .kg-filter-control-row {
						align-items: stretch;
					}

					#kindergartens-list-page .kg-filter-toggle,
					#kindergartens-list-page .kg-filter-clear {
						width: 100%;
						justify-content: center;
					}

					#kindergartens-list-page .kg-nearby-actions {
						grid-template-columns: 1fr;
						gap: 10px;
					}

					#kindergartens-list-page .kg-address-search {
						width: 100%;
						flex-basis: 100%;
						grid-template-columns: 1fr;
						gap: 8px;
					}

					#kindergartens-list-page .kg-radius-control {
						width: 100%;
						min-width: 0;
					}

					#kindergartens-list-page .kg-address-button,
					#kindergartens-list-page .kg-nearby-button,
					#kindergartens-list-page .kg-nearby-reset {
						width: 100%;
						max-width: none;
						grid-column: auto;
						justify-self: stretch;
					}

					#kindergartens-list-page .kg-nearby-active-note {
						grid-column: auto;
					}
				}

				@media (max-width: 700px) {
					#kindergartens-list-page .kg-kindergarten-hero-inner,
					#kindergartens-list-page .container.kg-kindergarten-container {
						width: calc(100vw - 24px) !important;
						max-width: calc(100vw - 24px) !important;
					}

					#kindergartens-list-page .kg-nearby-panel,
					#kindergartens-list-page .kg-map-preview,
					#kindergartens-list-page .kg-listing-area.kindergartens-page,
					#kindergartens-list-page .kg-top-kindergartens {
						width: 100% !important;
						max-width: 100% !important;
					}

					#kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view {
						grid-template-columns: 1fr !important;
					}

					#pc-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view,
					#mobile-wrap #kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-grid-view {
						grid-template-columns: 1fr !important;
					}
				}
			`}</style>
		</div>
	);
};

KindergartensPage.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			capacityRange: {
				start: 0,
				end: 500,
			},
			monthlyFeeRange: {
				start: 0,
				end: 2000000,
			},
		},
	},
};

export default withLayoutBasic(KindergartensPage);
