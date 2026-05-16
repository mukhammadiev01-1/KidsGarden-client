import React, { useMemo } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { GET_GROUPS } from '../../../apollo/user/query';
import { GroupStatus } from '../../enums/group.enum';
import { MemberType } from '../../enums/member.enum';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';

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
		<Stack spacing={3} sx={{ width: '100%' }}>
			<Stack spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>My Groups</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					View the class groups assigned to you. Group management stays with kindergarten admins.
				</Typography>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Assigned groups</Typography>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your groups...</Typography>}
				{!loading && groups.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>No active groups are assigned to you yet.</Typography>
				)}
				{groups.length > 0 && (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Age range</TableCell>
									<TableCell>Capacity</TableCell>
									<TableCell>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{groups.map((group) => (
									<TableRow key={group._id}>
										<TableCell>{group.groupName}</TableCell>
										<TableCell>{group.groupAgeRange}</TableCell>
										<TableCell>{group.groupCapacity}</TableCell>
										<TableCell>{group.groupStatus}</TableCell>
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
