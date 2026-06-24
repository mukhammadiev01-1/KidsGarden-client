import React, { useCallback, useEffect, useState } from 'react';
import {
	Stack,
	Typography,
	Checkbox,
	Button,
	OutlinedInput,
	Slider,
	Tooltip,
	IconButton,
} from '@mui/material';
import { DISCOVERY_KINDERGARTEN_TYPES, KindergartenLocation, KindergartenType } from '../../enums/kindergarten.enum';
import { KindergartensInquiry } from '../../types/kindergarten/kindergarten.input';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

interface FilterType {
	searchFilter: KindergartensInquiry;
	setSearchFilter: any;
	initialInput: KindergartensInquiry;
	onFilterChange?: () => void;
}

const centerTypeLabels: Record<string, string> = {
	[KindergartenType.PRIVATE_KINDERGARTEN]: 'Private Kindergarten',
	[KindergartenType.PUBLIC_KINDERGARTEN]: 'Public Kindergarten',
	[KindergartenType.DAYCARE_CENTER]: 'Daycare Center',
	[KindergartenType.APARTMENT]: 'Private Kindergarten',
	[KindergartenType.VILLA]: 'Public Kindergarten',
	[KindergartenType.HOUSE]: 'Daycare Center',
};

const programOptions = [
	{ value: 1, label: 'Montessori' },
	{ value: 2, label: 'Bilingual' },
	{ value: 3, label: 'Play-based' },
	{ value: 4, label: 'STEM' },
	{ value: 5, label: 'Art & Music' },
];

const formatYears = (value: number) => {
	if (value >= 5) return '5+ years';
	return `${value} ${value === 1 ? 'year' : 'years'}`;
};

const formatFee = (value: number) => `${value.toLocaleString()} UZS`;

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput, onFilterChange } = props;
	const router = useRouter();
	const [kindergartenLocation, setKindergartenLocation] = useState<KindergartenLocation[]>(Object.values(KindergartenLocation));
	const [kindergartenType, setKindergartenType] = useState<KindergartenType[]>(DISCOVERY_KINDERGARTEN_TYPES);
	const [searchText, setSearchText] = useState<string>('');
	const [openSections, setOpenSections] = useState({
		location: false,
		type: false,
		programs: false,
	});
	const selectedAgeRange = Number(searchFilter?.search?.ageRangeList?.[0] || 0);
	const selectedCapacityRange: [number, number] = [
		Number(searchFilter?.search?.capacityRange?.start ?? 0),
		Number(searchFilter?.search?.capacityRange?.end ?? 500),
	];
	const activeMonthlyFeeRange = searchFilter?.search?.monthlyFeeRange ?? searchFilter?.search?.pricesRange;
	const selectedMonthlyFeeRange: [number, number] = [
		Number(activeMonthlyFeeRange?.start ?? 0),
		Number(activeMonthlyFeeRange?.end ?? 2000000),
	];
	const listingBasePath = router.pathname.startsWith('/kindergartens') ? '/kindergartens' : '/property';

	/** LIFECYCLES **/
	useEffect(() => {
		const queryParams = JSON.stringify({
			...searchFilter,
			search: {
				...searchFilter.search,
			},
		});

		if (searchFilter?.search?.locationList?.length == 0) {
			delete searchFilter.search.locationList;
			router.push(`${listingBasePath}?input=${queryParams}`, `${listingBasePath}?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.typeList?.length == 0) {
			delete searchFilter.search.typeList;
			router.push(`${listingBasePath}?input=${queryParams}`, `${listingBasePath}?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.programsList?.length == 0) {
			delete searchFilter.search.programsList;
			router.push(`${listingBasePath}?input=${queryParams}`, `${listingBasePath}?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.ageRangeList?.length == 0) {
			delete searchFilter.search.ageRangeList;
			router.push(`${listingBasePath}?input=${queryParams}`, `${listingBasePath}?input=${queryParams}`, { scroll: false }).then();
		}

	}, [searchFilter]);

	/** HANDLERS **/
	const toggleFilterSection = (section: 'location' | 'type' | 'programs') => {
		setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
	};

	const pushFilter = useCallback(
		async (nextFilter: KindergartensInquiry) => {
			onFilterChange?.();
			const href = `${listingBasePath}?input=${JSON.stringify(nextFilter)}`;
			await router.push(
				href,
				href,
				{ scroll: false },
			);
		},
		[listingBasePath, onFilterChange, router],
	);

	const kindergartenLocationSelectHandler = useCallback(
		async (e: any) => {
			try {
				onFilterChange?.();
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.push(
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, locationList: [...(searchFilter?.search?.locationList || []), value] },
						})}`,
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, locationList: [...(searchFilter?.search?.locationList || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.locationList?.includes(value)) {
					await router.push(
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								locationList: searchFilter?.search?.locationList?.filter((item: string) => item !== value),
							},
						})}`,
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								locationList: searchFilter?.search?.locationList?.filter((item: string) => item !== value),
							},
						})}`,
						{ scroll: false },
					);
				}

				if (searchFilter?.search?.typeList?.length == 0) {
					alert('error');
				}

				console.log('kindergartenLocationSelectHandler:', e.target.value);
			} catch (err: any) {
				console.log('ERROR, kindergartenLocationSelectHandler:', err);
			}
		},
		[listingBasePath, onFilterChange, searchFilter],
	);

	const kindergartenTypeSelectHandler = useCallback(
		async (e: any) => {
			try {
				onFilterChange?.();
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.push(
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, typeList: [...(searchFilter?.search?.typeList || []), value] },
						})}`,
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, typeList: [...(searchFilter?.search?.typeList || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.typeList?.includes(value)) {
					await router.push(
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								typeList: searchFilter?.search?.typeList?.filter((item: string) => item !== value),
							},
						})}`,
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								typeList: searchFilter?.search?.typeList?.filter((item: string) => item !== value),
							},
						})}`,
						{ scroll: false },
					);
				}

				if (searchFilter?.search?.typeList?.length == 0) {
					alert('error');
				}

				console.log('kindergartenTypeSelectHandler:', e.target.value);
			} catch (err: any) {
				console.log('ERROR, kindergartenTypeSelectHandler:', err);
			}
		},
		[listingBasePath, onFilterChange, searchFilter],
	);

	const kindergartenProgramSelectHandler = useCallback(
		async (number: Number) => {
			try {
				onFilterChange?.();
				if (number != 0) {
					if (searchFilter?.search?.programsList?.includes(number)) {
						await router.push(
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: {
									...searchFilter.search,
									programsList: searchFilter?.search?.programsList?.filter((item: Number) => item !== number),
								},
							})}`,
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: {
									...searchFilter.search,
									programsList: searchFilter?.search?.programsList?.filter((item: Number) => item !== number),
								},
							})}`,
							{ scroll: false },
						);
					} else {
						await router.push(
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: { ...searchFilter.search, programsList: [...(searchFilter?.search?.programsList || []), number] },
							})}`,
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: { ...searchFilter.search, programsList: [...(searchFilter?.search?.programsList || []), number] },
							})}`,
							{ scroll: false },
						);
					}
				} else {
					delete searchFilter?.search.programsList;
					setSearchFilter({ ...searchFilter });
					await router.push(
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
							},
						})}`,
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
							},
						})}`,
						{ scroll: false },
					);
				}

				console.log('kindergartenProgramSelectHandler:', number);
			} catch (err: any) {
				console.log('ERROR, kindergartenProgramSelectHandler:', err);
			}
		},
		[listingBasePath, onFilterChange, searchFilter],
	);

	const kindergartenAgeRangeSelectHandler = useCallback(
		async (number: Number) => {
			try {
				onFilterChange?.();
				if (number != 0) {
					if (searchFilter?.search?.ageRangeList?.includes(number)) {
						await router.push(
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: {
									...searchFilter.search,
									ageRangeList: searchFilter?.search?.ageRangeList?.filter((item: Number) => item !== number),
								},
							})}`,
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: {
									...searchFilter.search,
									ageRangeList: searchFilter?.search?.ageRangeList?.filter((item: Number) => item !== number),
								},
							})}`,
							{ scroll: false },
						);
					} else {
						await router.push(
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: { ...searchFilter.search, ageRangeList: [...(searchFilter?.search?.ageRangeList || []), number] },
							})}`,
							`${listingBasePath}?input=${JSON.stringify({
								...searchFilter,
								search: { ...searchFilter.search, ageRangeList: [...(searchFilter?.search?.ageRangeList || []), number] },
							})}`,
							{ scroll: false },
						);
					}
				} else {
					delete searchFilter?.search.ageRangeList;
					setSearchFilter({ ...searchFilter });
					await router.push(
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
							},
						})}`,
						`${listingBasePath}?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
							},
						})}`,
						{ scroll: false },
					);
				}

				console.log('kindergartenAgeRangeSelectHandler:', number);
			} catch (err: any) {
				console.log('ERROR, kindergartenAgeRangeSelectHandler:', err);
			}
		},
		[listingBasePath, onFilterChange, searchFilter],
	);

	const kindergartenAgeRangeSliderHandler = useCallback(
		async (value: number) => {
			await pushFilter({
				...searchFilter,
				search: {
					...searchFilter.search,
					ageRangeList: [value],
				},
			});
		},
		[pushFilter, searchFilter],
	);

	const kindergartenRangeHandler = useCallback(
		async (rangeKey: 'capacityRange' | 'monthlyFeeRange', value: number | number[]) => {
			const [start, end] = Array.isArray(value) ? value : [0, value];
			const nextSearch = { ...searchFilter.search };
			if (rangeKey === 'monthlyFeeRange') delete nextSearch.pricesRange;

			await pushFilter({
				...searchFilter,
				search: {
					...nextSearch,
					[rangeKey]: { start, end },
				},
			});
		},
		[pushFilter, searchFilter],
	);

	const refreshHandler = async () => {
		try {
			onFilterChange?.();
			setSearchText('');
			const href = `${listingBasePath}?input=${JSON.stringify(initialInput)}`;
			await router.push(
				href,
				href,
				{ scroll: false },
			);
		} catch (err: any) {
			console.log('ERROR, refreshHandler:', err);
		}
	};

	return (
			<Stack className={'filter-main'}>
				<Stack className={'find-your-home'} mb={'40px'}>
					<Typography className={'title-main'}>Find a Kindergarten</Typography>
					<Stack className={'input-box'}>
						<OutlinedInput
							value={searchText}
							type={'text'}
							className={'search-input'}
							placeholder={'Search by name, program, or neighborhood'}
							onChange={(e: any) => setSearchText(e.target.value)}
							onKeyDown={(event: any) => {
								if (event.key == 'Enter') {
									onFilterChange?.();
									setSearchFilter({
										...searchFilter,
										search: { ...searchFilter.search, text: searchText },
									});
								}
							}}
							endAdornment={
								<>
									<CancelRoundedIcon
										onClick={() => {
											onFilterChange?.();
											setSearchText('');
											setSearchFilter({
												...searchFilter,
												search: { ...searchFilter.search, text: '' },
											});
										}}
									/>
								</>
							}
						/>
						<img src={'/img/icons/search_icon.png'} alt={''} />
						<Tooltip title="Reset">
							<IconButton onClick={refreshHandler}>
								<RefreshIcon />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<button
						type="button"
						className={`kg-filter-section-toggle ${openSections.location ? 'open' : ''}`}
						onClick={() => toggleFilterSection('location')}
						aria-expanded={openSections.location}
					>
						<span>Location</span>
						{Boolean(searchFilter?.search?.locationList?.length) && <em>{searchFilter?.search?.locationList?.length}</em>}
						<ExpandMoreRoundedIcon />
					</button>
					{openSections.location && (
						<Stack className={`kindergarten-location kg-filter-section-body`}>
							{kindergartenLocation.map((location: string) => {
								return (
									<Stack className={'input-box'} key={location}>
										<Checkbox
											id={location}
											className="kindergarten-checkbox"
											color="default"
											size="small"
											value={location}
											checked={(searchFilter?.search?.locationList || []).includes(location as KindergartenLocation)}
											onChange={kindergartenLocationSelectHandler}
										/>
										<label htmlFor={location} style={{ cursor: 'pointer' }}>
											<Typography className="kindergarten-type">{location}</Typography>
										</label>
									</Stack>
								);
							})}
						</Stack>
					)}
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<button
						type="button"
						className={`kg-filter-section-toggle ${openSections.type ? 'open' : ''}`}
						onClick={() => toggleFilterSection('type')}
						aria-expanded={openSections.type}
					>
						<span>Center Type</span>
						{Boolean(searchFilter?.search?.typeList?.length) && <em>{searchFilter?.search?.typeList?.length}</em>}
						<ExpandMoreRoundedIcon />
					</button>
					{openSections.type && (
						<Stack className="kg-filter-chip-list kg-filter-section-body">
							{kindergartenType.map((type: string) => {
								const checked = (searchFilter?.search?.typeList || []).includes(type as KindergartenType);
								return (
									<label className={`kg-filter-chip ${checked ? 'active' : ''}`} key={type}>
										<Checkbox
											className="kindergarten-checkbox"
											color="default"
											size="small"
											value={type}
											onChange={kindergartenTypeSelectHandler}
											checked={checked}
										/>
										<span>{centerTypeLabels[type] || type}</span>
									</label>
								);
							})}
						</Stack>
					)}
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<button
						type="button"
						className={`kg-filter-section-toggle ${openSections.programs ? 'open' : ''}`}
						onClick={() => toggleFilterSection('programs')}
						aria-expanded={openSections.programs}
					>
						<span>Programs</span>
						{Boolean(searchFilter?.search?.programsList?.length) && <em>{searchFilter?.search?.programsList?.length}</em>}
						<ExpandMoreRoundedIcon />
					</button>
					{openSections.programs && (
						<Stack className="kg-filter-chip-list kg-filter-section-body">
							<button
								type="button"
								className={`kg-filter-chip clear ${!searchFilter?.search?.programsList ? 'active' : ''}`}
								onClick={() => kindergartenProgramSelectHandler(0)}
							>
								Any program
							</button>
							{programOptions.map((program) => {
								const active = searchFilter?.search?.programsList?.includes(program.value);
								return (
									<button
										type="button"
										key={program.value}
										className={`kg-filter-chip ${active ? 'active' : ''}`}
										onClick={() => kindergartenProgramSelectHandler(program.value)}
									>
										{program.label}
									</button>
								);
							})}
						</Stack>
					)}
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Stack className="kg-filter-title-row">
						<Typography className={'title'}>Age Range</Typography>
						<button type="button" onClick={() => kindergartenAgeRangeSelectHandler(0)}>
							Any age
						</button>
					</Stack>
					<Stack className="kg-range-filter">
						<Typography className="kg-range-value">
							{selectedAgeRange ? `Around ${formatYears(selectedAgeRange)}` : 'Any age'}
						</Typography>
						<Slider
							min={1}
							max={5}
							step={1}
							value={selectedAgeRange || 1}
							onChangeCommitted={(_, value) => kindergartenAgeRangeSliderHandler(value as number)}
							valueLabelDisplay="auto"
							valueLabelFormat={(value) => formatYears(value)}
							className="kg-slider"
						/>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Capacity</Typography>
					<Stack className="kg-range-filter">
						<Typography className="kg-range-value">
							{selectedCapacityRange[0]} — {selectedCapacityRange[1]} children
						</Typography>
						<Slider
							min={0}
							max={500}
							step={10}
							value={selectedCapacityRange}
							onChangeCommitted={(_, value) => kindergartenRangeHandler('capacityRange', value as number[])}
							valueLabelDisplay="auto"
							className="kg-slider"
						/>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'}>
					<Typography className={'title'}>Monthly Fee</Typography>
					<Stack className="kg-range-filter">
						<Typography className="kg-range-value">
							{selectedMonthlyFeeRange[0] === 0 && selectedMonthlyFeeRange[1] === 2000000
								? 'Any price'
								: `${formatFee(selectedMonthlyFeeRange[0])} — ${formatFee(selectedMonthlyFeeRange[1])}`}
						</Typography>
						<Slider
							min={0}
							max={2000000}
							step={50000}
							value={selectedMonthlyFeeRange}
							onChangeCommitted={(_, value) => kindergartenRangeHandler('monthlyFeeRange', value as number[])}
							valueLabelDisplay="auto"
							valueLabelFormat={(value) => value.toLocaleString()}
							className="kg-slider"
						/>
					</Stack>
				</Stack>
			</Stack>
		);
};

export default Filter;
