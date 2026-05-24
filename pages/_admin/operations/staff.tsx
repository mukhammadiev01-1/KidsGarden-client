import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useQuery } from '@apollo/client';
import {
	Box,
	Chip,
	Divider,
	List,
	ListItem,
	MenuItem,
	Select,
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
	Button,
} from '@mui/material';
import { TabContext } from '@mui/lab';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { GET_KINDERGARTEN_STAFFS } from '../../../apollo/user/query';
import { KindergartenStaff } from '../../../libs/types/kindergarten-staff/kindergarten-staff';
import { KindergartenStaffsInquiry } from '../../../libs/types/kindergarten-staff/kindergarten-staff.input';
import { StaffRole, StaffStatus } from '../../../libs/enums/kindergarten-staff.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetErrorHandling } from '../../../libs/sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from '../../../libs/components/mypage/dashboardUtils';

const statusTabs = ['ALL', StaffStatus.ACTIVE, StaffStatus.PENDING, StaffStatus.BLOCKED, StaffStatus.REMOVED];

const buildSearch = (status: string, role: string, kindergartenId: string, memberId: string) => {
	const search: KindergartenStaffsInquiry['search'] = {};
	if (status !== 'ALL') search.staffStatus = status as StaffStatus;
	if (role !== 'ALL') search.staffRole = role as StaffRole;
	if (kindergartenId.trim()) search.kindergartenId = kindergartenId.trim();
	if (memberId.trim()) search.memberId = memberId.trim();
	return search;
};

const AdminOperationsStaff: NextPage = ({ initialInquiry }: any) => {
	const [staffInquiry, setStaffInquiry] = useState<KindergartenStaffsInquiry>(initialInquiry);
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [roleFilter, setRoleFilter] = useState<string>('ALL');
	const [kindergartenIdFilter, setKindergartenIdFilter] = useState<string>('');
	const [memberIdFilter, setMemberIdFilter] = useState<string>('');

	const { data, loading, error } = useQuery(GET_KINDERGARTEN_STAFFS, {
		variables: { input: staffInquiry },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const staffRecords: KindergartenStaff[] = data?.getKindergartenStaffs?.list ?? [];
	const total = data?.getKindergartenStaffs?.metaCounter?.[0]?.total ?? 0;

	const applyFilters = (nextStatus = statusFilter, nextRole = roleFilter) => {
		setStaffInquiry({
			...staffInquiry,
			page: 1,
			search: buildSearch(nextStatus, nextRole, kindergartenIdFilter, memberIdFilter),
		});
	};

	const clearFilters = () => {
		setStatusFilter('ALL');
		setRoleFilter('ALL');
		setKindergartenIdFilter('');
		setMemberIdFilter('');
		setStaffInquiry({
			...staffInquiry,
			page: 1,
			search: {},
		});
	};

	const tabChangeHandler = (event: any, newValue: string) => {
		setStatusFilter(newValue);
		applyFilters(newValue, roleFilter);
	};

	const roleChangeHandler = (value: string) => {
		setRoleFilter(value);
		applyFilters(statusFilter, value);
	};

	const changePageHandler = async (event: unknown, newPage: number) => {
		setStaffInquiry({ ...staffInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setStaffInquiry({ ...staffInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const renderRows = () => {
		if (loading) {
			return (
				<TableRow>
					<TableCell colSpan={7} align="center">
						Loading staff records...
					</TableCell>
				</TableRow>
			);
		}

		if (error) {
			return (
				<TableRow>
					<TableCell colSpan={7} align="center">
						Staff records could not be loaded.
					</TableCell>
				</TableRow>
			);
		}

		if (!staffRecords.length) {
			return (
				<TableRow>
					<TableCell colSpan={7} align="center">
						No staff records found.
					</TableCell>
				</TableRow>
			);
		}

		return staffRecords.map((staff) => {
			const isOwner = staff.staffRole === StaffRole.OWNER;

			return (
				<TableRow hover key={staff._id}>
					<TableCell align="left">
						<Typography title={staff._id}>{truncateId(staff._id)}</Typography>
					</TableCell>
					<TableCell align="left">
						<Typography title={staff.kindergartenId}>{truncateId(staff.kindergartenId)}</Typography>
					</TableCell>
					<TableCell align="left">
						<Typography title={staff.memberId}>{truncateId(staff.memberId)}</Typography>
					</TableCell>
					<TableCell align="center">
						<Stack spacing={0.75} alignItems="center">
							<Chip label={getStatusLabel(staff.staffRole)} size="small" sx={getStatusChipSx(staff.staffRole)} />
							{isOwner && <Chip label="Protected Owner" size="small" sx={getStatusChipSx(StaffStatus.BLOCKED)} />}
						</Stack>
					</TableCell>
					<TableCell align="center">
						<Chip label={getStatusLabel(staff.staffStatus)} size="small" sx={getStatusChipSx(staff.staffStatus)} />
					</TableCell>
					<TableCell align="left">{formatDate(staff.createdAt)}</TableCell>
					<TableCell align="left">{formatDate(staff.updatedAt)}</TableCell>
				</TableRow>
			);
		});
	};

	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '12px' }}>
				Operations Staff
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				Inspect kindergarten staff records across the platform. This MVP view is read-only.
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
							<Select sx={{ width: 170 }} value={roleFilter} onChange={(event) => roleChangeHandler(event.target.value)}>
								<MenuItem value="ALL">All roles</MenuItem>
								{Object.values(StaffRole).map((role) => (
									<MenuItem value={role} key={role}>
										{getStatusLabel(role)}
									</MenuItem>
								))}
							</Select>
							<TextField
								size="small"
								label="Kindergarten ID"
								value={kindergartenIdFilter}
								onChange={(event) => setKindergartenIdFilter(event.target.value)}
							/>
							<TextField
								size="small"
								label="Member ID"
								value={memberIdFilter}
								onChange={(event) => setMemberIdFilter(event.target.value)}
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
						<Table sx={{ minWidth: 980 }} size="medium">
							<TableHead>
								<TableRow>
									<TableCell align="left">STAFF ID</TableCell>
									<TableCell align="left">KINDERGARTEN ID</TableCell>
									<TableCell align="left">MEMBER ID</TableCell>
									<TableCell align="center">ROLE</TableCell>
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
						rowsPerPage={staffInquiry.limit}
						page={staffInquiry.page - 1}
						onPageChange={changePageHandler}
						onRowsPerPageChange={changeRowsPerPageHandler}
					/>
				</TabContext>
			</Box>
		</Box>
	);
};

AdminOperationsStaff.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 20,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	},
};

export default withAdminLayout(AdminOperationsStaff);
