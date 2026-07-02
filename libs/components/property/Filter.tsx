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
import { useTranslation } from 'next-i18next';

interface FilterType {
	searchFilter: KindergartensInquiry;
	setSearchFilter: any;
	initialInput: KindergartensInquiry;
	onFilterChange?: () => void;
}

const programOptions = [
	{ value: 1, labelKey: 'montessori' },
	{ value: 2, labelKey: 'bilingual' },
	{ value: 3, labelKey: 'playBased' },
	{ value: 4, labelKey: 'stem' },
	{ value: 5, labelKey: 'artMusic' },
];

const formatYears = (value: number, t: (key: string, options?: any) => string) => {
	if (value >= 5) return t('filters.yearsPlus', { count: 5 });
	return value === 1 ? t('filters.yearOne') : t('filters.years', { count: value });
};

const formatFee = (value: number) => `${value.toLocaleString()} UZS`;

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput, onFilterChange } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const [kindergartenLocation, setKindergartenLocation] = useState<KindergartenLocation[]>(Object.values(KindergartenLocation));
	const [kindergartenType, setKindergartenType] = useState<KindergartenType[]>(DISCOVERY_KINDERGARTEN_TYPES);
	const [searchText, setSearchText] = useState<string>('');
	const [openSections, setOpenSections] = useState({
		location: false,
		type: false,
		programs: false,
	});
	const selectedAgeRange = Number(searchFilter?.search?.ageRangeList?.[0] || 0);
	const selectedAgeLabel = selectedAgeRange
		? t('filters.aroundYears', { years: formatYears(selectedAgeRange, t) })
		: t('filters.anyAge');
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
			const nextFilter = {
				...searchFilter,
				search: {
					...searchFilter.search,
					ageRangeList: [value],
				},
			};

			setSearchFilter(nextFilter);
			await pushFilter(nextFilter);
		},
		[pushFilter, searchFilter, setSearchFilter],
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
					<Typography className={'title-main'}>{t('filters.title')}</Typography>
					<Stack className={'input-box'}>
						<OutlinedInput
							value={searchText}
							type={'text'}
							className={'search-input'}
							placeholder={t('filters.searchPlaceholder')}
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
						<Tooltip title={t('filters.reset')}>
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
						<span>{t('filters.location')}</span>
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
											<Typography className="kindergarten-type">{t(`filters.locations.${location}`, { defaultValue: location })}</Typography>
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
						<span>{t('filters.centerType')}</span>
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
										<span>{t(`filters.centerTypes.${type}`, { defaultValue: type })}</span>
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
						<span>{t('filters.programs')}</span>
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
								{t('filters.anyProgram')}
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
										{t(`filters.programOptions.${program.labelKey}`)}
									</button>
								);
							})}
						</Stack>
					)}
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Stack className="kg-filter-title-row">
						<Typography className={'title'}>{t('filters.ageRange')}</Typography>
						<button type="button" onClick={() => kindergartenAgeRangeSelectHandler(0)}>
							{selectedAgeLabel}
						</button>
					</Stack>
					<Stack className="kg-range-filter">
						<Typography className="kg-range-value">{selectedAgeLabel}</Typography>
						<Slider
							min={1}
							max={5}
							step={1}
							value={selectedAgeRange || 1}
							onChangeCommitted={(_, value) => kindergartenAgeRangeSliderHandler(value as number)}
							valueLabelDisplay="auto"
							valueLabelFormat={(value) => formatYears(value, t)}
							className="kg-slider"
						/>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>{t('filters.capacity')}</Typography>
					<Stack className="kg-range-filter">
						<Typography className="kg-range-value">
							{selectedCapacityRange[0]} — {selectedCapacityRange[1]} {t('filters.children')}
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
					<Typography className={'title'}>{t('filters.monthlyFee')}</Typography>
					<Stack className="kg-range-filter">
						<Typography className="kg-range-value">
							{selectedMonthlyFeeRange[0] === 0 && selectedMonthlyFeeRange[1] === 2000000
								? t('filters.anyPrice')
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
