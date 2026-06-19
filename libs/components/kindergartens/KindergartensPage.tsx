import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Menu, MenuItem, Pagination, Stack, Typography } from '@mui/material';
import KindergartenCard from '../property/KindergartenCard';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import withLayoutBasic from '../layout/LayoutBasic';
import Filter from '../property/Filter';
import { useRouter } from 'next/router';
import { KindergartensInquiry } from '../../types/kindergarten/kindergarten.input';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction } from '../../enums/common.enum';
import { useMutation, useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../../apollo/user/query';
import { LIKE_TARGET_KINDERGARTEN } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetLoginConfirmAlert } from '../../sweetAlert';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import Link from 'next/link';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
import { getImageUrl } from '../../config';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../utils';
import KakaoKindergartenListMap from '../maps/KakaoKindergartenListMap';

type ListingView = 'grid' | 'list';
type MapPresetKey = 'all' | 'trending' | 'popular' | 'topRank';

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
	{ key: 'topRank', label: 'Top Rank', sort: 'kindergartenRank', direction: Direction.DESC },
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
	const listingBasePath = router.pathname.startsWith('/kindergartens') ? '/kindergartens' : '/property';

	const getListingHref = (input: KindergartensInquiry) => `${listingBasePath}?input=${JSON.stringify(input)}`;

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);

	const {
		loading: getKindergartensLoading,
		data: getKindergartensData,
		refetch: getKindergartensRefetch,
	} = useQuery(GET_KINDERGARTENS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: any) => {
			setKindergartens(data?.getKindergartens?.list || []);
			setTotal(data?.getKindergartens?.metaCounter?.[0]?.total || 0);
		},
	});

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

	/** HANDLERS **/
	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
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

	const searchButtonHandler = async () => {
		const nextFilter = { ...searchFilter, page: 1 };
		const href = getListingHref(nextFilter);
		setSearchFilter(nextFilter);
		await router.push(href, href, { scroll: false });
	};

	const selectedLocation = searchFilter?.search?.locationList?.[0] || 'All locations';
	const selectedType = searchFilter?.search?.typeList?.[0]
		? getKindergartenTypeLabel(searchFilter.search.typeList[0])
		: 'All types';
	const selectedAge = searchFilter?.search?.ageRangeList?.[0]
		? `${searchFilter.search.ageRangeList[0]} years`
		: 'All ages';
	const selectedPrograms = searchFilter?.search?.programsList?.[0]
		? `${searchFilter.search.programsList[0]}+ programs`
		: 'All programs';
	const activeMonthlyFeeRange = searchFilter?.search?.monthlyFeeRange ?? searchFilter?.search?.pricesRange;
	const selectedFee =
		activeMonthlyFeeRange?.end && activeMonthlyFeeRange.end < 2000000
			? `Up to ${formatMonthlyFee(activeMonthlyFeeRange.end)}`
			: 'Any fee';

	const topKindergartens = kindergartens.slice(0, 4);
	const activePresetKey = getActivePresetKey(searchFilter);

	const likeKindergartenHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert('Please login first');
				if (confirmed) await router.push('/account/join');
				return;
			}
			await likeTargetKindergarten({ variables: { input: id } });
			await getKindergartensRefetch({ input: searchFilter });
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
				<Stack className="kg-search-panel">
					{[
						['Location', selectedLocation],
						['Center Type', selectedType],
						['Age Range', selectedAge],
						['Programs', selectedPrograms],
						['Monthly Fee', selectedFee],
					].map(([label, value]) => (
						<Box component="div" className="kg-search-field" key={label}>
							<span>{label}</span>
							<strong>{value}</strong>
						</Box>
					))}
					<Button className="kg-search-button" onClick={searchButtonHandler} endIcon={<SearchRoundedIcon />}>
						Search
					</Button>
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
						{total || kindergartens.length} kindergartens found in this area
					</Box>
					<KakaoKindergartenListMap kindergartens={kindergartens} />
				</Stack>

				<Stack className={'kindergartens-page kg-listing-area'}>
					<Stack className={'filter-config'}>
						{/* @ts-ignore */}
						<Filter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} />
					</Stack>
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
									<p>No kindergartens found yet.</p>
									<span>Try adjusting your filters or check back soon.</span>
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
							{kindergartens.length !== 0 && (
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
										{total} kindergarten{total > 1 ? 's' : ''} found
									</Typography>
								</Stack>
							)}
						</Stack>
					</Stack>
				</Stack>

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
				#kindergartens-list-page .container.kg-kindergarten-container,
				#kindergartens-list-page .kg-search-panel,
				#kindergartens-list-page .kg-map-preview,
				#kindergartens-list-page .kg-listing-area.kindergartens-page,
				#kindergartens-list-page .kg-top-kindergartens {
					width: min(1200px, calc(100vw - 24px)) !important;
					max-width: calc(100vw - 24px) !important;
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

				#kindergartens-list-page .kg-search-panel {
					display: grid !important;
					grid-template-columns: repeat(auto-fit, minmax(min(158px, 100%), 1fr)) !important;
					gap: 12px !important;
				}

				#kindergartens-list-page .kg-search-panel .kg-search-button,
				#kindergartens-list-page .kg-search-panel .kg-search-field {
					width: 100% !important;
					min-width: 0 !important;
				}

				#kindergartens-list-page .kg-map-tabs button,
				#kindergartens-list-page .kg-view-toggle button {
					border: 0;
					font: inherit;
					cursor: pointer;
					appearance: none;
				}

				#kindergartens-list-page .kg-map-tabs button {
					padding: 9px 15px;
					border-radius: 999px;
					background: transparent;
					color: #26382b;
					font-weight: 900;
				}

				#kindergartens-list-page .kg-map-tabs button.active {
					background: #2f7d4a;
					color: #fff;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page {
					display: flex !important;
					flex-wrap: wrap !important;
					align-items: flex-start !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .filter-config {
					flex: 0 0 260px !important;
					width: 260px !important;
					max-width: 100% !important;
					min-width: 0 !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .main-config {
					flex: 1 1 620px !important;
					width: auto !important;
					max-width: 100% !important;
					min-width: 0 !important;
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
					grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 320px)) !important;
					justify-content: start !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .list-config.kg-list-view {
					display: flex !important;
					flex-direction: column !important;
					gap: 16px !important;
				}

				#kindergartens-list-page .kg-listing-area.kindergartens-page .kg-grid-view .card-config {
					width: 100% !important;
					max-width: 320px !important;
					min-width: 0 !important;
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

				@media (max-width: 900px) {
					#kindergartens-list-page .kg-list-card {
						grid-template-columns: 1fr;
					}

					#kindergartens-list-page .kg-list-card-side {
						align-items: flex-start;
						text-align: left;
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
