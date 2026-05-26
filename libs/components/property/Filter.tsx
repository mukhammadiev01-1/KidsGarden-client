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
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { KindergartenLocation, KindergartenType } from '../../enums/kindergarten.enum';
import { KindergartensInquiry } from '../../types/kindergarten/kindergarten.input';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';

interface FilterType {
	searchFilter: KindergartensInquiry;
	setSearchFilter: any;
	initialInput: KindergartensInquiry;
}

const centerTypeLabels: Record<string, string> = {
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
	const { searchFilter, setSearchFilter, initialInput } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [kindergartenLocation, setKindergartenLocation] = useState<KindergartenLocation[]>(Object.values(KindergartenLocation));
	const [kindergartenType, setKindergartenType] = useState<KindergartenType[]>(Object.values(KindergartenType));
	const [searchText, setSearchText] = useState<string>('');
	const [showMore, setShowMore] = useState<boolean>(false);
	const selectedAgeRange = Number(searchFilter?.search?.ageRangeList?.[0] || 0);
	const selectedCapacityRange: [number, number] = [
		Number(searchFilter?.search?.capacityRange?.start ?? 0),
		Number(searchFilter?.search?.capacityRange?.end ?? 500),
	];
	const selectedPriceRange: [number, number] = [
		Number(searchFilter?.search?.pricesRange?.start ?? 0),
		Number(searchFilter?.search?.pricesRange?.end ?? 2000000),
	];

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
			setShowMore(false);
			router.push(`/property?input=${queryParams}`, `/property?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.typeList?.length == 0) {
			delete searchFilter.search.typeList;
			router.push(`/property?input=${queryParams}`, `/property?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.programsList?.length == 0) {
			delete searchFilter.search.programsList;
			router.push(`/property?input=${queryParams}`, `/property?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.ageRangeList?.length == 0) {
			delete searchFilter.search.ageRangeList;
			router.push(`/property?input=${queryParams}`, `/property?input=${queryParams}`, { scroll: false }).then();
		}

		if (searchFilter?.search?.locationList) setShowMore(true);
	}, [searchFilter]);

	/** HANDLERS **/
	const pushFilter = useCallback(
		async (nextFilter: KindergartensInquiry) => {
			await router.push(
				`/property?input=${JSON.stringify(nextFilter)}`,
				`/property?input=${JSON.stringify(nextFilter)}`,
				{ scroll: false },
			);
		},
		[router],
	);

	const kindergartenLocationSelectHandler = useCallback(
		async (e: any) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.push(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, locationList: [...(searchFilter?.search?.locationList || []), value] },
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, locationList: [...(searchFilter?.search?.locationList || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.locationList?.includes(value)) {
					await router.push(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								locationList: searchFilter?.search?.locationList?.filter((item: string) => item !== value),
							},
						})}`,
						`/property?input=${JSON.stringify({
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
		[searchFilter],
	);

	const kindergartenTypeSelectHandler = useCallback(
		async (e: any) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.push(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, typeList: [...(searchFilter?.search?.typeList || []), value] },
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, typeList: [...(searchFilter?.search?.typeList || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.typeList?.includes(value)) {
					await router.push(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								typeList: searchFilter?.search?.typeList?.filter((item: string) => item !== value),
							},
						})}`,
						`/property?input=${JSON.stringify({
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
		[searchFilter],
	);

	const kindergartenProgramSelectHandler = useCallback(
		async (number: Number) => {
			try {
				if (number != 0) {
					if (searchFilter?.search?.programsList?.includes(number)) {
						await router.push(
							`/property?input=${JSON.stringify({
								...searchFilter,
								search: {
									...searchFilter.search,
									programsList: searchFilter?.search?.programsList?.filter((item: Number) => item !== number),
								},
							})}`,
							`/property?input=${JSON.stringify({
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
							`/property?input=${JSON.stringify({
								...searchFilter,
								search: { ...searchFilter.search, programsList: [...(searchFilter?.search?.programsList || []), number] },
							})}`,
							`/property?input=${JSON.stringify({
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
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
							},
						})}`,
						`/property?input=${JSON.stringify({
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
		[searchFilter],
	);

	const kindergartenAgeRangeSelectHandler = useCallback(
		async (number: Number) => {
			try {
				if (number != 0) {
					if (searchFilter?.search?.ageRangeList?.includes(number)) {
						await router.push(
							`/property?input=${JSON.stringify({
								...searchFilter,
								search: {
									...searchFilter.search,
									ageRangeList: searchFilter?.search?.ageRangeList?.filter((item: Number) => item !== number),
								},
							})}`,
							`/property?input=${JSON.stringify({
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
							`/property?input=${JSON.stringify({
								...searchFilter,
								search: { ...searchFilter.search, ageRangeList: [...(searchFilter?.search?.ageRangeList || []), number] },
							})}`,
							`/property?input=${JSON.stringify({
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
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
							},
						})}`,
						`/property?input=${JSON.stringify({
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
		[searchFilter],
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
		async (rangeKey: 'capacityRange' | 'pricesRange', value: number | number[]) => {
			const [start, end] = Array.isArray(value) ? value : [0, value];
			await pushFilter({
				...searchFilter,
				search: {
					...searchFilter.search,
					[rangeKey]: { start, end },
				},
			});
		},
		[pushFilter, searchFilter],
	);

	const refreshHandler = async () => {
		try {
			setSearchText('');
			await router.push(
				`/property?input=${JSON.stringify(initialInput)}`,
				`/property?input=${JSON.stringify(initialInput)}`,
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
					<p className={'title'}>District / Location</p>
					<Stack
						className={`property-location`}
						style={{ height: showMore || device === 'mobile' ? 'auto' : '115px' }}
						onMouseEnter={() => setShowMore(true)}
						onMouseLeave={() => {
							if (!searchFilter?.search?.locationList) {
								setShowMore(false);
							}
						}}
					>
						{kindergartenLocation.map((location: string) => {
							return (
								<Stack className={'input-box'} key={location}>
									<Checkbox
										id={location}
										className="property-checkbox"
										color="default"
										size="small"
										value={location}
										checked={(searchFilter?.search?.locationList || []).includes(location as KindergartenLocation)}
										onChange={kindergartenLocationSelectHandler}
									/>
									<label htmlFor={location} style={{ cursor: 'pointer' }}>
										<Typography className="property-type">{location}</Typography>
									</label>
								</Stack>
							);
						})}
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Center Type</Typography>
					<Stack className="kg-filter-chip-list">
						{kindergartenType.map((type: string) => {
							const checked = (searchFilter?.search?.typeList || []).includes(type as KindergartenType);
							return (
								<label className={`kg-filter-chip ${checked ? 'active' : ''}`} key={type}>
									<Checkbox
										className="property-checkbox"
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
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Programs</Typography>
					<Stack className="kg-filter-chip-list">
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
							{selectedPriceRange[0] === 0 && selectedPriceRange[1] === 2000000
								? 'Any price'
								: `${formatFee(selectedPriceRange[0])} — ${formatFee(selectedPriceRange[1])}`}
						</Typography>
						<Slider
							min={0}
							max={2000000}
							step={50000}
							value={selectedPriceRange}
							onChangeCommitted={(_, value) => kindergartenRangeHandler('pricesRange', value as number[])}
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
