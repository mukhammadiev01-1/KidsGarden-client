import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Menu, MenuItem, Pagination, Stack, Typography } from '@mui/material';
import PropertyCard from '../../libs/components/property/PropertyCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Filter from '../../libs/components/property/Filter';
import { useRouter } from 'next/router';
import { KindergartensInquiry } from '../../libs/types/kindergarten/kindergarten.input';
import { Kindergarten } from '../../libs/types/kindergarten/kindergarten';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction } from '../../libs/enums/common.enum';
import { useMutation, useQuery } from '@apollo/client';
import { GET_KINDERGARTENS } from '../../apollo/user/query';
import { LIKE_TARGET_KINDERGARTEN } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetLoginConfirmAlert } from '../../libs/sweetAlert';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
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
import { getImageUrl } from '../../libs/config';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PropertyList: NextPage = ({ initialInput, ...props }: any) => {
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

	/** HANDLERS **/
	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		await router.push(
			`/property?input=${JSON.stringify(searchFilter)}`,
			`/property?input=${JSON.stringify(searchFilter)}`,
			{
				scroll: false,
			},
		);
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

	const sortingHandler = (e: React.MouseEvent<HTMLLIElement>) => {
		switch (e.currentTarget.id) {
			case 'new':
				setSearchFilter({ ...searchFilter, sort: 'createdAt', direction: Direction.ASC });
				setFilterSortName('New');
				break;
			case 'lowest':
				setSearchFilter({ ...searchFilter, sort: 'kindergartenPrice', direction: Direction.ASC });
				setFilterSortName('Lowest Fee');
				break;
			case 'highest':
				setSearchFilter({ ...searchFilter, sort: 'kindergartenPrice', direction: Direction.DESC });
				setFilterSortName('Highest Fee');
		}
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const searchButtonHandler = async () => {
		const nextFilter = { ...searchFilter, page: 1 };
		setSearchFilter(nextFilter);
		await router.push(`/property?input=${JSON.stringify(nextFilter)}`, `/property?input=${JSON.stringify(nextFilter)}`, {
			scroll: false,
		});
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
	const selectedFee =
		searchFilter?.search?.pricesRange?.end && searchFilter.search.pricesRange.end < 2000000
			? `Up to ${formatMonthlyFee(searchFilter.search.pricesRange.end)}`
			: 'Any fee';

	const topKindergartens = kindergartens.slice(0, 4);

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

	return (
		<div id="property-list-page" style={{ position: 'relative' }}>
			<Stack className="kg-property-hero">
				<Box component="div" className="kg-property-hero-inner">
					<Stack className="kg-property-hero-copy">
						<Typography component="h1">Find the right kindergarten for your child</Typography>
						<Typography className="kg-property-hero-subtitle">
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
					<Box component="div" className="kg-property-hero-visual">
						<div className="kg-hero-photo" />
						<div className="kg-hero-leaf kg-hero-leaf-one" />
						<div className="kg-hero-leaf kg-hero-leaf-two" />
					</Box>
				</Box>
			</Stack>

			<div className="container kg-property-container">
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

				<Stack className="kg-map-preview">
					<Stack className="kg-map-tabs">
						<span className="active">All</span>
						<span>Trending</span>
						<span>Popular</span>
						<span>Top Rated</span>
					</Stack>
					<Box component="div" className="kg-map-count">
						{total || kindergartens.length} kindergartens found in this area
					</Box>
					<Stack className="kg-map-label">
						<Typography component="h2">Map preview</Typography>
						<span>Live map coming soon</span>
					</Stack>
					{[18, 32, 48, 63, 78].map((left, index) => (
						<span
							className={`kg-map-pin ${index % 2 ? 'honey' : 'green'}`}
							style={{ left: `${left}%`, top: `${index % 2 ? 48 : 34 + index * 7}%` }}
							key={left}
						/>
					))}
					<Stack className="kg-map-controls">
						<span>+</span>
						<span>-</span>
					</Stack>
				</Stack>

				<Stack className={'property-page kg-listing-area'}>
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
									<span className="active">
										<GridViewRoundedIcon />
									</span>
									<span>
										<ViewListRoundedIcon />
									</span>
								</Stack>
							</Stack>
						</Stack>
						<Stack className={'list-config'}>
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
									return (
										<PropertyCard
											kindergarten={kindergarten}
											key={kindergarten?._id}
											likeKindergartenHandler={likeKindergartenHandler}
										/>
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
							<Link href="/property">See all top kindergartens</Link>
						</Stack>
						<Stack className="kg-top-strip-list">
							{topKindergartens.map((kindergarten, index) => (
								<Link
									className="kg-top-mini-card"
									href={{ pathname: '/property/detail', query: { id: kindergarten?._id } }}
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
				#property-list-page {
					overflow-x: hidden;
				}

				#property-list-page .kg-property-hero-inner,
				#property-list-page .container.kg-property-container,
				#property-list-page .kg-search-panel,
				#property-list-page .kg-map-preview,
				#property-list-page .kg-listing-area.property-page,
				#property-list-page .kg-top-kindergartens {
					width: min(1200px, calc(100vw - 24px)) !important;
					max-width: calc(100vw - 24px) !important;
					min-width: 0 !important;
					box-sizing: border-box;
				}

				#property-list-page .kg-property-hero-copy,
				#property-list-page .kg-property-hero-copy h1,
				#property-list-page .kg-property-hero-copy .kg-property-hero-subtitle,
				#property-list-page .kg-property-hero-copy .kg-trust-chips,
				#property-list-page .kg-property-hero-visual {
					max-width: calc(100vw - 48px) !important;
					min-width: 0 !important;
					box-sizing: border-box;
				}

				#property-list-page .kg-property-hero-copy h1,
				#property-list-page .kg-property-hero-copy .kg-property-hero-subtitle {
					white-space: normal !important;
					overflow-wrap: anywhere !important;
				}

				#property-list-page .kg-search-panel {
					display: grid !important;
					grid-template-columns: repeat(auto-fit, minmax(min(158px, 100%), 1fr)) !important;
					gap: 12px !important;
				}

				#property-list-page .kg-search-panel .kg-search-button,
				#property-list-page .kg-search-panel .kg-search-field {
					width: 100% !important;
					min-width: 0 !important;
				}

				#property-list-page .kg-listing-area.property-page {
					display: flex !important;
					flex-wrap: wrap !important;
					align-items: flex-start !important;
				}

				#property-list-page .kg-listing-area.property-page .filter-config {
					flex: 0 0 260px !important;
					width: 260px !important;
					max-width: 100% !important;
					min-width: 0 !important;
				}

				#property-list-page .kg-listing-area.property-page .main-config {
					flex: 1 1 620px !important;
					width: auto !important;
					max-width: 100% !important;
					min-width: 0 !important;
				}

				#property-list-page .kg-listing-area.property-page .list-config {
					display: grid !important;
					grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 320px)) !important;
					justify-content: start !important;
				}

				#property-list-page .kg-listing-area.property-page .card-config {
					width: 100% !important;
					max-width: 320px !important;
					min-width: 0 !important;
				}

				#property-list-page .kg-top-kindergartens .kg-top-strip-list {
					display: grid !important;
					grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
				}
			`}</style>
		</div>
	);
};

PropertyList.defaultProps = {
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
			pricesRange: {
				start: 0,
				end: 2000000,
			},
		},
	},
};

export default withLayoutBasic(PropertyList);
