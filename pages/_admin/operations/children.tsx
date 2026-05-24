import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useQuery } from '@apollo/client';
import {
	Box,
	Button,
	Chip,
	Divider,
	List,
	ListItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { TabContext } from '@mui/lab';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { GET_CHILDREN } from '../../../apollo/user/query';
import { Child } from '../../../libs/types/child/child';
import { ChildrenInquiry } from '../../../libs/types/child/child.input';
import { ChildStatus } from '../../../libs/enums/child.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetErrorHandling } from '../../../libs/sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from '../../../libs/components/mypage/dashboardUtils';

const statusTabs = ['ALL', ChildStatus.ACTIVE, ChildStatus.INACTIVE, ChildStatus.GRADUATED, ChildStatus.TRANSFERRED];

const buildSearch = (
	status: string,
	kindergartenId: string,
	groupId: string,
	childFullName: string,
	parentId: string,
) => {
	const search: ChildrenInquiry['search'] = {};
	if (status !== 'ALL') search.childStatus = status as ChildStatus;
	if (kindergartenId.trim()) search.kindergartenId = kindergartenId.trim();
	if (groupId.trim()) search.groupId = groupId.trim();
	if (childFullName.trim()) search.text = childFullName.trim();
	if (parentId.trim()) search.parentId = parentId.trim();
	return search;
};

const getChildAge = (birthDate?: Date | string) => {
	if (!birthDate) return '-';

	const parsedBirthDate = new Date(birthDate);
	if (Number.isNaN(parsedBirthDate.getTime())) return '-';

	const today = new Date();
	let age = today.getFullYear() - parsedBirthDate.getFullYear();
	const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
	const birthdayHasNotPassed =
		monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate());

	if (birthdayHasNotPassed) age -= 1;
	return age >= 0 ? `${age}` : '-';
};

const AdminOperationsChildren: NextPage = ({ initialInquiry }: any) => {
	const [childrenInquiry, setChildrenInquiry] = useState<ChildrenInquiry>(initialInquiry);
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [kindergartenIdFilter, setKindergartenIdFilter] = useState<string>('');
	const [groupIdFilter, setGroupIdFilter] = useState<string>('');
	const [childFullNameFilter, setChildFullNameFilter] = useState<string>('');
	const [parentIdFilter, setParentIdFilter] = useState<string>('');

	const { data, loading, error } = useQuery(GET_CHILDREN, {
		variables: { input: childrenInquiry },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const children: Child[] = data?.getChildren?.list ?? [];
	const total = data?.getChildren?.metaCounter?.[0]?.total ?? 0;

	const applyFilters = (nextStatus = statusFilter) => {
		setChildrenInquiry({
			...childrenInquiry,
			page: 1,
			search: buildSearch(
				nextStatus,
				kindergartenIdFilter,
				groupIdFilter,
				childFullNameFilter,
				parentIdFilter,
			),
		});
	};

	const clearFilters = () => {
		setStatusFilter('ALL');
		setKindergartenIdFilter('');
		setGroupIdFilter('');
		setChildFullNameFilter('');
		setParentIdFilter('');
		setChildrenInquiry({
			...childrenInquiry,
			page: 1,
			search: {},
		});
	};

	const tabChangeHandler = (event: any, newValue: string) => {
		setStatusFilter(newValue);
		applyFilters(newValue);
	};

	const changePageHandler = async (event: unknown, newPage: number) => {
		setChildrenInquiry({ ...childrenInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setChildrenInquiry({ ...childrenInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const renderRows = () => {
		if (loading) {
			return (
				<TableRow>
					<TableCell colSpan={10} align="center">
						Loading child records...
					</TableCell>
				</TableRow>
			);
		}

		if (error) {
			return (
				<TableRow>
					<TableCell colSpan={10} align="center">
						Child records could not be loaded.
					</TableCell>
				</TableRow>
			);
		}

		if (!children.length) {
			return (
				<TableRow>
					<TableCell colSpan={10} align="center">
						No child records found.
					</TableCell>
				</TableRow>
			);
		}

		return children.map((child) => (
			<TableRow hover key={child._id}>
				<TableCell align="left">
					<Typography title={child._id}>{truncateId(child._id)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography sx={{ fontWeight: 700 }}>{child.childFullName}</Typography>
				</TableCell>
				<TableCell align="center">{getStatusLabel(child.childGender)}</TableCell>
				<TableCell align="center">
					<Stack spacing={0.25} alignItems="center">
						<Typography>{formatDate(child.childBirthDate)}</Typography>
						<Typography sx={{ fontSize: '12px', color: '#6b7280' }}>Age {getChildAge(child.childBirthDate)}</Typography>
					</Stack>
				</TableCell>
				<TableCell align="left">
					<Typography title={child.kindergartenId}>{truncateId(child.kindergartenId)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={child.groupId}>{truncateId(child.groupId)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={child.parentId}>{truncateId(child.parentId)}</Typography>
				</TableCell>
				<TableCell align="center">
					<Chip label={getStatusLabel(child.childStatus)} size="small" sx={getStatusChipSx(child.childStatus)} />
				</TableCell>
				<TableCell align="left">{formatDate(child.createdAt)}</TableCell>
				<TableCell align="left">{formatDate(child.updatedAt)}</TableCell>
			</TableRow>
		));
	};

	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '12px' }}>
				Operations Children
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				Inspect child records across the platform. This MVP view is read-only.
			</Typography>

			<Box component="div" className="table-wrap">
				<TabContext value={statusFilter}>
					<Box component="div">
						<List className="tab-menu">
							{statusTabs.map((status) => (
								<ListItem
									key={status}
									onClick={(event) => tabChangeHandler(event, status)}
									value={status}
									className={statusFilter === status ? 'li on' : 'li'}
								>
									{getStatusLabel(status)}
								</ListItem>
							))}
						</List>
						<Divider />
						<Stack className="search-area" sx={{ m: '24px', gap: '12px', flexDirection: 'row', flexWrap: 'wrap' }}>
							<TextField
								size="small"
								label="Kindergarten ID"
								value={kindergartenIdFilter}
								onChange={(event) => setKindergartenIdFilter(event.target.value)}
							/>
							<TextField
								size="small"
								label="Group ID"
								value={groupIdFilter}
								onChange={(event) => setGroupIdFilter(event.target.value)}
							/>
							<TextField
								size="small"
								label="Child name"
								value={childFullNameFilter}
								onChange={(event) => setChildFullNameFilter(event.target.value)}
							/>
							<TextField
								size="small"
								label="Parent ID"
								value={parentIdFilter}
								onChange={(event) => setParentIdFilter(event.target.value)}
							/>
							<Button variant="contained" onClick={() => applyFilters()}>
								Apply
							</Button>
							<Button variant="outlined" onClick={clearFilters}>
								Clear
							</Button>
						</Stack>
						<Divider />
					</Box>

					<TableContainer>
						<Table sx={{ minWidth: 1260 }} size="medium">
							<TableHead>
								<TableRow>
									<TableCell align="left">CHILD ID</TableCell>
									<TableCell align="left">FULL NAME</TableCell>
									<TableCell align="center">GENDER</TableCell>
									<TableCell align="center">BIRTH DATE</TableCell>
									<TableCell align="left">KINDERGARTEN ID</TableCell>
									<TableCell align="left">GROUP ID</TableCell>
									<TableCell align="left">PARENT ID</TableCell>
									<TableCell align="center">STATUS</TableCell>
									<TableCell align="left">CREATED</TableCell>
									<TableCell align="left">UPDATED</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>{renderRows()}</TableBody>
						</Table>
					</TableContainer>

					<TablePagination
						rowsPerPageOptions={[10, 20, 50, 100]}
						component="div"
						count={total}
						rowsPerPage={childrenInquiry.limit}
						page={childrenInquiry.page - 1}
						onPageChange={changePageHandler}
						onRowsPerPageChange={changeRowsPerPageHandler}
					/>
				</TabContext>
			</Box>
		</Box>
	);
};

AdminOperationsChildren.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 20,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	},
};

export default withAdminLayout(AdminOperationsChildren);
