import React, { useMemo } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { GET_GROUPS } from '../../../apollo/user/query';
import { GroupStatus } from '../../enums/group.enum';
import { MemberType } from '../../enums/member.enum';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';
import { getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';

const TeacherGroups = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const groupsInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			search: {
				groupStatus: GroupStatus.ACTIVE,
			},
		}),
		[],
	);

	const { data, loading } = useQuery(GET_GROUPS, {
		variables: { input: groupsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.TEACHER,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const groups: Group[] = data?.getGroups?.list ?? [];

	if (user.memberType !== MemberType.TEACHER) {
		router.back();
		return null;
	}

	return (
		<Stack className="teacher-dashboard-screen teacher-groups-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>My Groups</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					View the class groups assigned to you. Group management stays with kindergarten admins.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Assigned groups</Typography>
						<Typography className="dashboard-panel-subtitle">
							Active groups available for attendance work.
						</Typography>
					</Stack>
					<Chip label={`${groups.length} active`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your groups...</Typography>}
				{!loading && groups.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No active groups are assigned to you yet.
					</Typography>
				)}
				{groups.length > 0 && (
					<TableContainer className="dashboard-table-container teacher-groups-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Kindergarten</TableCell>
									<TableCell>Age range</TableCell>
									<TableCell>Capacity</TableCell>
									<TableCell>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{groups.map((group) => (
									<TableRow key={group._id}>
										<TableCell>
											<Stack spacing={0.25}>
												<Typography className="dashboard-primary-text">{group.groupName}</Typography>
												<Typography className="dashboard-muted-text">Group ID {truncateId(group._id)}</Typography>
											</Stack>
										</TableCell>
										<TableCell>
											<Stack spacing={0.25}>
												<Typography className="dashboard-primary-text">Kindergarten reference</Typography>
												<Typography className="dashboard-muted-text">{truncateId(group.kindergartenId)}</Typography>
											</Stack>
										</TableCell>
										<TableCell>{group.groupAgeRange}</TableCell>
										<TableCell>{group.groupCapacity} children</TableCell>
										<TableCell>
											<Chip label={getStatusLabel(group.groupStatus)} size="small" sx={getStatusChipSx(group.groupStatus)} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Stack>
		</Stack>
	);
};

export default TeacherGroups;
