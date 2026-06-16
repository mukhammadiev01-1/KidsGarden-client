import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, Box, Modal, Divider, Button } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DISCOVERY_KINDERGARTEN_TYPES, KindergartenLocation, KindergartenType } from '../../enums/kindergarten.enum';
import { KindergartensInquiry } from '../../types/kindergarten/kindergarten.input';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getKindergartenTypeLabel } from '../../utils';
import Link from 'next/link';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	borderRadius: '12px',
	outline: 'none',
	boxShadow: 24,
};

const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: '200px',
		},
	},
};

const thisYear = new Date().getFullYear();
const establishedYears = Array.from({ length: thisYear - 1970 + 1 }, (_, index) => 1970 + index);
const capacityOptions = [0, 25, 50, 75, 100, 125, 150, 200, 300, 500];
const kindergartenTypeImageNames: Partial<Record<KindergartenType, string>> = {
	[KindergartenType.PRIVATE_KINDERGARTEN]: 'private-kindergarten',
	[KindergartenType.PUBLIC_KINDERGARTEN]: 'public-kindergarten',
	[KindergartenType.DAYCARE_CENTER]: 'daycare-center',
	[KindergartenType.APARTMENT]: 'private-kindergarten',
	[KindergartenType.VILLA]: 'public-kindergarten',
	[KindergartenType.HOUSE]: 'daycare-center',
};

interface HeaderFilterProps {
	initialInput: KindergartensInquiry;
}

const HeaderFilter = (props: HeaderFilterProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const { t, i18n } = useTranslation('common');
	const [searchFilter, setSearchFilter] = useState<KindergartensInquiry>(initialInput);
	const locationRef: any = useRef();
	const typeRef: any = useRef();
	const roomsRef: any = useRef();
	const router = useRouter();
	const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
	const [openLocation, setOpenLocation] = useState(false);
	const [openType, setOpenType] = useState(false);
	const [openRooms, setOpenRooms] = useState(false);
	const [isNarrowViewport, setIsNarrowViewport] = useState(false);
	const [kindergartenLocations] = useState<KindergartenLocation[]>(Object.values(KindergartenLocation));
	const [kindergartenTypes] = useState<KindergartenType[]>(DISCOVERY_KINDERGARTEN_TYPES);
	const [yearCheck, setYearCheck] = useState({ start: 1970, end: thisYear });
	const [optionCheck, setOptionCheck] = useState('all');

	/** LIFECYCLES **/
	useEffect(() => {
		const clickHandler = (event: MouseEvent) => {
			if (!locationRef?.current?.contains(event.target)) {
				setOpenLocation(false);
			}

			if (!typeRef?.current?.contains(event.target)) {
				setOpenType(false);
			}

			if (!roomsRef?.current?.contains(event.target)) {
				setOpenRooms(false);
			}
		};

		document.addEventListener('mousedown', clickHandler);

		return () => {
			document.removeEventListener('mousedown', clickHandler);
		};
	}, []);

	useEffect(() => {
		const syncViewport = () => {
			setIsNarrowViewport(window.innerWidth <= 768);
		};

		syncViewport();
		window.addEventListener('resize', syncViewport);

		return () => {
			window.removeEventListener('resize', syncViewport);
		};
	}, []);

	/** HANDLERS **/
	const advancedFilterHandler = (status: boolean) => {
		setOpenLocation(false);
		setOpenRooms(false);
		setOpenType(false);
		setOpenAdvancedFilter(status);
	};

	const locationStateChangeHandler = () => {
		setOpenLocation((prev) => !prev);
		setOpenRooms(false);
		setOpenType(false);
	};

	const typeStateChangeHandler = () => {
		setOpenType((prev) => !prev);
		setOpenLocation(false);
		setOpenRooms(false);
	};

	const roomStateChangeHandler = () => {
		setOpenRooms((prev) => !prev);
		setOpenType(false);
		setOpenLocation(false);
	};

	const disableAllStateHandler = () => {
		setOpenRooms(false);
		setOpenType(false);
		setOpenLocation(false);
	};

	const kindergartenLocationSelectHandler = useCallback(
		async (value: KindergartenLocation) => {
			try {
				setSearchFilter({
					...searchFilter,
					search: {
						...searchFilter.search,
						locationList: [value],
					},
				});
				typeStateChangeHandler();
			} catch (err: any) {
				console.log('ERROR, kindergartenLocationSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const kindergartenTypeSelectHandler = useCallback(
		async (value: KindergartenType) => {
			try {
				setSearchFilter({
					...searchFilter,
					search: {
						...searchFilter.search,
						typeList: [value],
					},
				});
				roomStateChangeHandler();
			} catch (err: any) {
				console.log('ERROR, kindergartenTypeSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const kindergartenProgramSelectHandler = useCallback(
		async (value: number) => {
			try {
				setSearchFilter({
					...searchFilter,
					search: {
						...searchFilter.search,
						programsList: [value],
					},
				});
				disableAllStateHandler();
			} catch (err: any) {
				console.log('ERROR, kindergartenProgramSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const kindergartenAgeSelectHandler = useCallback(
		async (number: Number) => {
			try {
				if (number != 0) {
					if (searchFilter?.search?.ageRangeList?.includes(number)) {
						setSearchFilter({
							...searchFilter,
							search: {
								...searchFilter.search,
								ageRangeList: searchFilter?.search?.ageRangeList?.filter((item: Number) => item !== number),
							},
						});
					} else {
						setSearchFilter({
							...searchFilter,
							search: { ...searchFilter.search, ageRangeList: [...(searchFilter?.search?.ageRangeList || []), number] },
						});
					}
				} else {
					delete searchFilter?.search.ageRangeList;
					setSearchFilter({ ...searchFilter });
				}

				console.log('kindergartenAgeSelectHandler:', number);
			} catch (err: any) {
				console.log('ERROR, kindergartenAgeSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const kindergartenProgramOptionSelectHandler = useCallback(
		async (e: any) => {
			try {
				const value = e.target.value;
				setOptionCheck(value);
			} catch (err: any) {
				console.log('ERROR, kindergartenProgramOptionSelectHandler:', err);
			}
		},
		[],
	);

	const capacityRangeHandler = useCallback(
		async (e: any, type: string) => {
			const value = e.target.value;
			const capacityRange = searchFilter.search.capacityRange || { start: 0, end: 500 };

			if (type == 'start') {
				setSearchFilter({
					...searchFilter,
					search: {
						...searchFilter.search,
						capacityRange: { ...capacityRange, start: parseInt(value) },
					},
				});
			} else {
				setSearchFilter({
					...searchFilter,
					search: {
						...searchFilter.search,
						capacityRange: { ...capacityRange, end: parseInt(value) },
					},
				});
			}
		},
		[searchFilter],
	);

	const yearStartChangeHandler = async (event: any) => {
		setYearCheck({ ...yearCheck, start: Number(event.target.value) });

		setSearchFilter({
			...searchFilter,
			search: {
				...searchFilter.search,
				periodsRange: { start: Number(event.target.value), end: yearCheck.end },
			},
		});
	};

	const yearEndChangeHandler = async (event: any) => {
		setYearCheck({ ...yearCheck, end: Number(event.target.value) });

		setSearchFilter({
			...searchFilter,
			search: {
				...searchFilter.search,
				periodsRange: { start: yearCheck.start, end: Number(event.target.value) },
			},
		});
	};

	const resetFilterHandler = () => {
		setSearchFilter(initialInput);
		setOptionCheck('all');
		setYearCheck({ start: 1970, end: thisYear });
	};

	const pushSearchHandler = async () => {
		try {
			if (searchFilter?.search?.locationList?.length == 0) {
				delete searchFilter.search.locationList;
			}

			if (searchFilter?.search?.typeList?.length == 0) {
				delete searchFilter.search.typeList;
			}

			if (searchFilter?.search?.programsList?.length == 0) {
				delete searchFilter.search.programsList;
			}

			if (searchFilter?.search?.ageRangeList?.length == 0) {
				delete searchFilter.search.ageRangeList;
			}

			await router.push(
				`/kindergartens?input=${JSON.stringify(searchFilter)}`,
				`/kindergartens?input=${JSON.stringify(searchFilter)}`,
			);
		} catch (err: any) {
			console.log('ERROR, pushSearchHandler:', err);
		}
	};

	const heroFeatureCards = (
		<Stack className={'hero-feature-cards'}>
			<Box component={'article'} className={'hero-feature-card safe-card'}>
				<Box component={'div'} className={'feature-icon'}>
					<ShieldOutlinedIcon />
				</Box>
				<Box component={'div'} className={'feature-copy'}>
					<strong>Safe &amp; Secure</strong>
					<span>Your data is always protected</span>
				</Box>
			</Box>
			<Box component={'article'} className={'hero-feature-card communication-card'}>
				<Box component={'div'} className={'feature-icon'}>
					<GroupsOutlinedIcon />
				</Box>
				<Box component={'div'} className={'feature-copy'}>
					<strong>Better Communication</strong>
					<span>Parents and teachers stay connected</span>
				</Box>
			</Box>
			<Box component={'article'} className={'hero-feature-card management-card'}>
				<Box component={'div'} className={'feature-icon'}>
					<EventAvailableOutlinedIcon />
				</Box>
				<Box component={'div'} className={'feature-copy'}>
					<strong>Smart Management</strong>
					<span>Save time and focus on what matters</span>
				</Box>
			</Box>
			<Box component={'article'} className={'hero-feature-card growth-card'}>
				<Box component={'div'} className={'feature-icon'}>
					<TrendingUpRoundedIcon />
				</Box>
				<Box component={'div'} className={'feature-copy'}>
					<strong>Grow Together</strong>
					<span>Tools to help every child thrive</span>
				</Box>
			</Box>
		</Stack>
	);

	if (device === 'mobile' || isNarrowViewport) {
		return (
			<Stack
				className={'mobile-hero'}
				sx={{
					width: 'min(100%, calc(100vw - 72px), 696px)',
					maxWidth: 'min(100%, calc(100vw - 72px), 696px)',
					mx: 'auto',
					overflow: 'hidden',
				}}
			>
				<Stack className={'hero-copy'}>
					<span className={'eyebrow'}>
						<AutoAwesomeRoundedIcon />
						All-in-One Early Learning Platform
					</span>
					<h1>
						Everything your kindergarten needs, <span>in one place</span>
					</h1>
					<p>
						Manage applications, attendance, communication, schedules, and more &mdash; so teachers can teach and
						children can grow.
					</p>
				</Stack>
				<Stack className={'hero-actions'}>
					<Link href={'/kindergartens'}>
						<span>
							<RocketLaunchRoundedIcon />
							Explore Kindergartens
						</span>
					</Link>
					<Link href={'/cs'}>
						<span>
							<PlayCircleFilledRoundedIcon />
							See How It Works
						</span>
					</Link>
				</Stack>
				{heroFeatureCards}
			</Stack>
		);
	} else {
		return (
			<>
				<Stack className={'hero-copy'}>
					<span className={'eyebrow'}>
						<AutoAwesomeRoundedIcon />
						All-in-One Early Learning Platform
					</span>
					<h1>
						Everything your kindergarten needs, <span>in one place</span>
					</h1>
					<p>
						Manage applications, attendance, communication, schedules, and more &mdash; so teachers can teach and
						children can grow.
					</p>
					<Stack className={'hero-actions'}>
						<Link href={'/kindergartens'}>
							<span>
								<RocketLaunchRoundedIcon />
								Explore Kindergartens
							</span>
						</Link>
						<Link href={'/cs'}>
							<span>
								<PlayCircleFilledRoundedIcon />
								See How It Works
							</span>
						</Link>
					</Stack>
				</Stack>
				{heroFeatureCards}
			</>
		);
	}
};

HeaderFilter.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
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

export default HeaderFilter;
