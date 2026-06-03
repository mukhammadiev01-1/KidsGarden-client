import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useMutation, useQuery } from '@apollo/client';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, List, ListItem, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TabContext } from '@mui/lab';
import TablePagination from '@mui/material/TablePagination';
import { KindergartenPanelList } from '../../../libs/components/admin/kindergartens/KindergartenList';
import { AllKindergartensInquiry } from '../../../libs/types/kindergarten/kindergarten.input';
import { Kindergarten } from '../../../libs/types/kindergarten/kindergarten';
import { KindergartenLocation, KindergartenStatus } from '../../../libs/enums/kindergarten.enum';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';
import { KindergartenUpdate } from '../../../libs/types/kindergarten/kindergarten.update';
import { GET_ALL_KINDERGARTENS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_KINDERGARTEN_BY_ADMIN } from '../../../apollo/admin/mutation';

const AdminKindergartens: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);
	const [kindergartensInquiry, setKindergartensInquiry] = useState<AllKindergartensInquiry>(initialInquiry);
	const [kindergartens, setKindergartens] = useState<Kindergarten[]>([]);
	const [kindergartensTotal, setKindergartensTotal] = useState<number>(0);
	const [value, setValue] = useState(
		kindergartensInquiry?.search?.kindergartenStatus ? kindergartensInquiry?.search?.kindergartenStatus : 'ALL',
	);
	const [searchType, setSearchType] = useState('ALL');

	/** APOLLO REQUESTS **/
	const [updateKindergartenByAdmin] = useMutation(UPDATE_KINDERGARTEN_BY_ADMIN);
	const { loading, refetch } = useQuery(GET_ALL_KINDERGARTENS_BY_ADMIN, {
		variables: { input: kindergartensInquiry },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data) => {
			setKindergartens(data?.getAllKindergartensByAdmin?.list ?? []);
			setKindergartensTotal(data?.getAllKindergartensByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
		onError: (err) => sweetErrorHandling(err).then(),
	});

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		kindergartensInquiry.page = newPage + 1;
		setKindergartensInquiry({ ...kindergartensInquiry });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		kindergartensInquiry.limit = parseInt(event.target.value, 10);
		kindergartensInquiry.page = 1;
		setKindergartensInquiry({ ...kindergartensInquiry });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = async (event: any, newValue: string) => {
		setValue(newValue);
		const nextSearch = { ...kindergartensInquiry.search };

		switch (newValue) {
			case 'ACTIVE':
				nextSearch.kindergartenStatus = KindergartenStatus.ACTIVE;
				break;
			case 'CLOSED':
				nextSearch.kindergartenStatus = KindergartenStatus.CLOSED;
				break;
			case 'DELETE':
				nextSearch.kindergartenStatus = KindergartenStatus.DELETE;
				break;
			default:
				delete nextSearch.kindergartenStatus;
				break;
		}

		setKindergartensInquiry({ ...kindergartensInquiry, page: 1, sort: 'createdAt', search: nextSearch });
	};

	const searchTypeHandler = async (newValue: string) => {
		try {
			setSearchType(newValue);
			const nextSearch = { ...kindergartensInquiry.search };

			if (newValue !== 'ALL') {
				nextSearch.kindergartenLocationList = [newValue as KindergartenLocation];
			} else {
				delete nextSearch.kindergartenLocationList;
			}

			setKindergartensInquiry({
				...kindergartensInquiry,
				page: 1,
				sort: 'createdAt',
				search: nextSearch,
			});
		} catch (err: any) {
			console.log('searchTypeHandler: ', err.message);
		}
	};

	const updateKindergartenHandler = async (updateData: KindergartenUpdate) => {
		try {
			if (!updateData.kindergartenStatus) throw new Error('Only kindergarten status updates are available.');
			await updateKindergartenByAdmin({
				variables: {
					input: {
						_id: updateData._id,
						kindergartenStatus: updateData.kindergartenStatus,
					},
				},
			});
			const refreshed = await refetch();
			setKindergartens(refreshed?.data?.getAllKindergartensByAdmin?.list ?? []);
			setKindergartensTotal(refreshed?.data?.getAllKindergartensByAdmin?.metaCounter?.[0]?.total ?? 0);
			menuIconCloseHandler();
			await sweetMixinSuccessAlert('Kindergarten status updated');
		} catch (err: any) {
			menuIconCloseHandler();
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Kindergarten List
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'ALL')}
									value="ALL"
									className={value === 'ALL' ? 'li on' : 'li'}
								>
									All
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'ACTIVE')}
									value="ACTIVE"
									className={value === 'ACTIVE' ? 'li on' : 'li'}
								>
									Active
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'CLOSED')}
									value="CLOSED"
									className={value === 'CLOSED' ? 'li on' : 'li'}
								>
									Closed
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'DELETE')}
									value="DELETE"
									className={value === 'DELETE' ? 'li on' : 'li'}
								>
									Deleted
								</ListItem>
							</List>
							<Divider />
							<Stack className={'search-area'} sx={{ m: '24px' }}>
								<Select sx={{ width: '180px', mr: '20px' }} value={searchType}>
									<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
										All Locations
									</MenuItem>
									{Object.values(KindergartenLocation).map((location: string) => (
										<MenuItem value={location} onClick={() => searchTypeHandler(location)} key={location}>
											{location}
										</MenuItem>
									))}
								</Select>
							</Stack>
							<Divider />
						</Box>
						<KindergartenPanelList
							kindergartens={kindergartens}
							loading={loading}
							anchorEl={anchorEl}
							menuIconClickHandler={menuIconClickHandler}
							menuIconCloseHandler={menuIconCloseHandler}
							updateKindergartenHandler={updateKindergartenHandler}
						/>

						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={kindergartensTotal}
							rowsPerPage={kindergartensInquiry?.limit}
							page={kindergartensInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminKindergartens.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminKindergartens);
