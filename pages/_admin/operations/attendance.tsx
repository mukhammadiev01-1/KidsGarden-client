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
import { GET_ATTENDANCES } from '../../../apollo/user/query';
import { Attendance } from '../../../libs/types/attendance/attendance';
import { AttendancesInquiry } from '../../../libs/types/attendance/attendance.input';
import { AttendanceStatus } from '../../../libs/enums/attendance.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetErrorHandling } from '../../../libs/sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from '../../../libs/components/mypage/dashboardUtils';

const statusTabs = [
	'ALL',
	AttendanceStatus.PRESENT,
	AttendanceStatus.ABSENT,
	AttendanceStatus.LATE,
	AttendanceStatus.EXCUSED,
];

const buildSearch = (
	status: string,
	kindergartenId: string,
	groupId: string,
	childId: string,
	attendanceDate: string,
) => {
	const search: AttendancesInquiry['search'] = {};
	if (status !== 'ALL') search.attendanceStatus = status as AttendanceStatus;
	if (kindergartenId.trim()) search.kindergartenId = kindergartenId.trim();
	if (groupId.trim()) search.groupId = groupId.trim();
	if (childId.trim()) search.childId = childId.trim();
	if (attendanceDate.trim()) search.attendanceDate = attendanceDate.trim();
	return search;
};

const truncateText = (text?: string, visible = 72) => {
	if (!text) return '-';
	return text.length > visible ? `${text.slice(0, visible)}...` : text;
};

const AdminOperationsAttendance: NextPage = ({ initialInquiry }: any) => {
	const [attendancesInquiry, setAttendancesInquiry] = useState<AttendancesInquiry>(initialInquiry);
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [kindergartenIdFilter, setKindergartenIdFilter] = useState<string>('');
	const [groupIdFilter, setGroupIdFilter] = useState<string>('');
	const [childIdFilter, setChildIdFilter] = useState<string>('');
	const [attendanceDateFilter, setAttendanceDateFilter] = useState<string>('');

	const { data, loading, error } = useQuery(GET_ATTENDANCES, {
		variables: { input: attendancesInquiry },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const attendances: Attendance[] = data?.getAttendances?.list ?? [];
	const total = data?.getAttendances?.metaCounter?.[0]?.total ?? 0;

	const applyFilters = (nextStatus = statusFilter) => {
		setAttendancesInquiry({
			...attendancesInquiry,
			page: 1,
			search: buildSearch(nextStatus, kindergartenIdFilter, groupIdFilter, childIdFilter, attendanceDateFilter),
		});
	};

	const clearFilters = () => {
		setStatusFilter('ALL');
		setKindergartenIdFilter('');
		setGroupIdFilter('');
		setChildIdFilter('');
		setAttendanceDateFilter('');
		setAttendancesInquiry({
			...attendancesInquiry,
			page: 1,
			search: {},
		});
	};

	const tabChangeHandler = (event: any, newValue: string) => {
		setStatusFilter(newValue);
		applyFilters(newValue);
	};

	const changePageHandler = async (event: unknown, newPage: number) => {
		setAttendancesInquiry({ ...attendancesInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setAttendancesInquiry({ ...attendancesInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const renderRows = () => {
		if (loading) {
			return (
				<TableRow>
					<TableCell colSpan={10} align="center">
						Loading attendance records...
					</TableCell>
				</TableRow>
			);
		}

		if (error) {
			return (
				<TableRow>
					<TableCell colSpan={10} align="center">
						Attendance records could not be loaded.
					</TableCell>
				</TableRow>
			);
		}

		if (!attendances.length) {
			return (
				<TableRow>
					<TableCell colSpan={10} align="center">
						No attendance records found.
					</TableCell>
				</TableRow>
			);
		}

		return attendances.map((attendance) => (
			<TableRow hover key={attendance._id}>
				<TableCell align="left">
					<Typography title={attendance._id}>{truncateId(attendance._id)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={attendance.childId}>{truncateId(attendance.childId)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={attendance.kindergartenId}>{truncateId(attendance.kindergartenId)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={attendance.groupId}>{truncateId(attendance.groupId)}</Typography>
				</TableCell>
				<TableCell align="left">{formatDate(attendance.attendanceDate)}</TableCell>
				<TableCell align="center">
					<Chip
						label={getStatusLabel(attendance.attendanceStatus)}
						size="small"
						sx={getStatusChipSx(attendance.attendanceStatus)}
					/>
				</TableCell>
				<TableCell align="left">
					<Typography title={attendance.markedBy}>{truncateId(attendance.markedBy)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={attendance.note || ''} sx={{ maxWidth: 260 }}>
						{truncateText(attendance.note)}
					</Typography>
				</TableCell>
				<TableCell align="left">{formatDate(attendance.createdAt)}</TableCell>
				<TableCell align="left">{formatDate(attendance.updatedAt)}</TableCell>
			</TableRow>
		));
	};

	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '12px' }}>
				Operations Attendance
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				Inspect attendance records across the platform. This MVP view is read-only.
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
								label="Child ID"
								value={childIdFilter}
								onChange={(event) => setChildIdFilter(event.target.value)}
							/>
							<TextField
								size="small"
								label="Attendance date"
								type="date"
								value={attendanceDateFilter}
								onChange={(event) => setAttendanceDateFilter(event.target.value)}
								InputLabelProps={{ shrink: true }}
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
						<Table sx={{ minWidth: 1320 }} size="medium">
							<TableHead>
								<TableRow>
									<TableCell align="left">ATTENDANCE ID</TableCell>
									<TableCell align="left">CHILD ID</TableCell>
									<TableCell align="left">KINDERGARTEN ID</TableCell>
									<TableCell align="left">GROUP ID</TableCell>
									<TableCell align="left">DATE</TableCell>
									<TableCell align="center">STATUS</TableCell>
									<TableCell align="left">MARKED BY</TableCell>
									<TableCell align="left">NOTE</TableCell>
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
						rowsPerPage={attendancesInquiry.limit}
						page={attendancesInquiry.page - 1}
						onPageChange={changePageHandler}
						onRowsPerPageChange={changeRowsPerPageHandler}
					/>
				</TabContext>
			</Box>
		</Box>
	);
};

AdminOperationsAttendance.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 20,
		sort: 'attendanceDate',
		direction: Direction.DESC,
		search: {},
	},
};

export default withAdminLayout(AdminOperationsAttendance);
