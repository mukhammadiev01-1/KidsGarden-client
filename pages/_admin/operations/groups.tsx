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
} from '@mui/material';
import { TabContext } from '@mui/lab';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { GET_GROUPS } from '../../../apollo/user/query';
import { Group } from '../../../libs/types/group/group';
import { GroupsInquiry } from '../../../libs/types/group/group.input';
import { GroupStatus } from '../../../libs/enums/group.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetErrorHandling } from '../../../libs/sweetAlert';
import { formatDate, getStatusChipSx, truncateId } from '../../../libs/components/mypage/dashboardUtils';
import { useAdminTranslation } from '../../../libs/i18n/adminTranslator';

const statusTabs = ['ALL', GroupStatus.ACTIVE, GroupStatus.INACTIVE, GroupStatus.FULL, GroupStatus.ARCHIVED];

const buildSearch = (status: string, kindergartenId: string, groupName: string) => {
	const search: GroupsInquiry['search'] = {};
	if (status !== 'ALL') search.groupStatus = status as GroupStatus;
	if (kindergartenId.trim()) search.kindergartenId = kindergartenId.trim();
	if (groupName.trim()) search.text = groupName.trim();
	return search;
};

const AdminOperationsGroups: NextPage = ({ initialInquiry }: any) => {
	const { t, statusLabel } = useAdminTranslation();
	const [groupsInquiry, setGroupsInquiry] = useState<GroupsInquiry>(initialInquiry);
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [kindergartenIdFilter, setKindergartenIdFilter] = useState<string>('');
	const [groupNameFilter, setGroupNameFilter] = useState<string>('');

	const { data, loading, error } = useQuery(GET_GROUPS, {
		variables: { input: groupsInquiry },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const groups: Group[] = data?.getGroups?.list ?? [];
	const total = data?.getGroups?.metaCounter?.[0]?.total ?? 0;

	const applyFilters = (nextStatus = statusFilter) => {
		setGroupsInquiry({
			...groupsInquiry,
			page: 1,
			search: buildSearch(nextStatus, kindergartenIdFilter, groupNameFilter),
		});
	};

	const clearFilters = () => {
		setStatusFilter('ALL');
		setKindergartenIdFilter('');
		setGroupNameFilter('');
		setGroupsInquiry({
			...groupsInquiry,
			page: 1,
			search: {},
		});
	};

	const tabChangeHandler = (event: any, newValue: string) => {
		setStatusFilter(newValue);
		applyFilters(newValue);
	};

	const changePageHandler = async (event: unknown, newPage: number) => {
		setGroupsInquiry({ ...groupsInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setGroupsInquiry({ ...groupsInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const renderTeacherIds = (teacherIds: string[] = []) => {
		if (!teacherIds.length) return <Typography sx={{ color: '#9ca3af' }}>{t('adminOps.groups.noTeachers')}</Typography>;

		const previewIds = teacherIds.slice(0, 3);
		const remaining = teacherIds.length - previewIds.length;

		return (
			<Stack spacing={0.25}>
				<Typography sx={{ fontWeight: 700 }}>
					{teacherIds.length === 1
						? t('adminOps.groups.teacherCountOne')
						: t('adminOps.groups.teacherCount', { count: teacherIds.length })}
				</Typography>
				{previewIds.map((teacherId) => (
					<Typography key={teacherId} title={teacherId} sx={{ fontSize: '12px', color: '#6b7280' }}>
						{truncateId(teacherId)}
					</Typography>
				))}
				{remaining > 0 && (
					<Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>{t('adminOps.groups.moreCount', { count: remaining })}</Typography>
				)}
			</Stack>
		);
	};

	const renderRows = () => {
		if (loading) {
			return (
				<TableRow>
					<TableCell colSpan={9} align="center">
						{t('adminOps.groups.loading')}
					</TableCell>
				</TableRow>
			);
		}

		if (error) {
			return (
				<TableRow>
					<TableCell colSpan={9} align="center">
						{t('adminOps.groups.loadError')}
					</TableCell>
				</TableRow>
			);
		}

		if (!groups.length) {
			return (
				<TableRow>
					<TableCell colSpan={9} align="center">
						{t('adminOps.groups.empty')}
					</TableCell>
				</TableRow>
			);
		}

		return groups.map((group) => (
			<TableRow hover key={group._id}>
				<TableCell align="left">
					<Typography title={group._id}>{truncateId(group._id)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography title={group.kindergartenId}>{truncateId(group.kindergartenId)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Typography sx={{ fontWeight: 700 }}>{group.groupName}</Typography>
				</TableCell>
				<TableCell align="center">{group.groupAgeRange || '-'}</TableCell>
				<TableCell align="center">{group.groupCapacity}</TableCell>
				<TableCell align="center">
					<Chip label={statusLabel(group.groupStatus)} size="small" sx={getStatusChipSx(group.groupStatus)} />
				</TableCell>
				<TableCell align="left">{renderTeacherIds(group.teacherIds)}</TableCell>
				<TableCell align="left">{formatDate(group.createdAt)}</TableCell>
				<TableCell align="left">{formatDate(group.updatedAt)}</TableCell>
			</TableRow>
		));
	};

	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '12px' }}>
				{t('adminOps.groups.title')}
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				{t('adminOps.groups.subtitle')}
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
									{statusLabel(status)}
								</ListItem>
							))}
						</List>
						<Divider />
						<Stack className="search-area" sx={{ m: '24px', gap: '12px', flexDirection: 'row', flexWrap: 'wrap' }}>
							<TextField
								size="small"
								label={t('adminOps.common.kindergartenId')}
								value={kindergartenIdFilter}
								onChange={(event) => setKindergartenIdFilter(event.target.value)}
							/>
							<TextField
								size="small"
								label={t('adminOps.groups.groupName')}
								value={groupNameFilter}
								onChange={(event) => setGroupNameFilter(event.target.value)}
							/>
							<Button variant="contained" onClick={() => applyFilters()}>
								{t('common.apply')}
							</Button>
							<Button variant="outlined" onClick={clearFilters}>
								{t('common.clear')}
							</Button>
						</Stack>
						<Divider />
					</Box>

					<TableContainer>
						<Table sx={{ minWidth: 1120 }} size="medium">
							<TableHead>
								<TableRow>
									<TableCell align="left">{t('adminOps.common.groupId')}</TableCell>
									<TableCell align="left">{t('adminOps.common.kindergartenId')}</TableCell>
									<TableCell align="left">{t('adminOps.groups.groupName')}</TableCell>
									<TableCell align="center">{t('adminTables.ageRange')}</TableCell>
									<TableCell align="center">{t('adminTables.capacity')}</TableCell>
									<TableCell align="center">{t('adminTables.status')}</TableCell>
									<TableCell align="left">{t('kadmin.teachers')}</TableCell>
									<TableCell align="left">{t('adminTables.created')}</TableCell>
									<TableCell align="left">{t('adminTables.updated')}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>{renderRows()}</TableBody>
						</Table>
					</TableContainer>

					<TablePagination
						rowsPerPageOptions={[10, 20, 50, 100]}
						component="div"
						count={total}
						rowsPerPage={groupsInquiry.limit}
						page={groupsInquiry.page - 1}
						onPageChange={changePageHandler}
						onRowsPerPageChange={changeRowsPerPageHandler}
					/>
				</TabContext>
			</Box>
		</Box>
	);
};

AdminOperationsGroups.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 20,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	},
};

export default withAdminLayout(AdminOperationsGroups);
