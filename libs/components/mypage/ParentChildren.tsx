import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { GET_CHILDREN, GET_GROUP, GET_KINDERGARTEN } from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { Child } from '../../types/child/child';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';

const getAge = (birthDate?: Date | string) => {
	if (!birthDate) return '-';
	const parsedBirthDate = new Date(birthDate);
	if (Number.isNaN(parsedBirthDate.getTime())) return '-';

	const today = new Date();
	let age = today.getFullYear() - parsedBirthDate.getFullYear();
	const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate())) age -= 1;

	return age >= 0 ? `${age}` : '-';
};

const ParentChildren = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [kindergartenNames, setKindergartenNames] = useState<Record<string, string>>({});
	const [groupsById, setGroupsById] = useState<
		Record<string, Pick<Group, '_id' | 'groupName' | 'groupAgeRange' | 'groupCapacity' | 'groupStatus'> | null>
	>({});

	const childrenInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			search: {},
		}),
		[],
	);

	const { data, loading } = useQuery(GET_CHILDREN, {
		variables: { input: childrenInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const children: Child[] = data?.getChildren?.list ?? [];
	const kindergartenIds = useMemo(
		() => Array.from(new Set(children.map((child) => child.kindergartenId).filter(Boolean))),
		[children],
	);
	const groupIds = useMemo(() => Array.from(new Set(children.map((child) => child.groupId).filter(Boolean))), [children]);

	useEffect(() => {
		const missingKindergartenIds = kindergartenIds.filter((kindergartenId) => !kindergartenNames[kindergartenId]);
		if (!missingKindergartenIds.length) return;

		let isMounted = true;

		Promise.all(
			missingKindergartenIds.map(async (kindergartenId) => {
				try {
					const result = await apolloClient.query({
						query: GET_KINDERGARTEN,
						variables: { input: kindergartenId },
						fetchPolicy: 'cache-first',
					});

					return [kindergartenId, result.data?.getKindergarten?.kindergartenTitle || kindergartenId] as const;
				} catch (err) {
					return [kindergartenId, kindergartenId] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setKindergartenNames((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, kindergartenIds, kindergartenNames]);

	useEffect(() => {
		const missingGroupIds = groupIds.filter((groupId) => !(groupId in groupsById));
		if (!missingGroupIds.length) return;

		let isMounted = true;

		Promise.all(
			missingGroupIds.map(async (groupId) => {
				try {
					const result = await apolloClient.query({
						query: GET_GROUP,
						variables: { groupId },
						fetchPolicy: 'cache-first',
					});

					return [groupId, result.data?.getGroup ?? null] as const;
				} catch (err) {
					return [groupId, null] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setGroupsById((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, groupIds, groupsById]);

	if (user.memberType !== MemberType.PARENT) {
		router.back();
		return null;
	}

	return (
		<Stack className="parent-dashboard-screen parent-children-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>My Children</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					View your enrolled children and their kindergarten details.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Children</Typography>
						<Typography className="dashboard-panel-subtitle">
							Enrollment, classroom, and center details linked to your parent account.
						</Typography>
					</Stack>
					<Chip label={`${children.length} linked`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your children...</Typography>}
				{!loading && children.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No children are linked to your parent account yet. Please contact your kindergarten center.
					</Typography>
				)}
				{children.length > 0 && (
					<TableContainer className="dashboard-table-container parent-children-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Birth date</TableCell>
									<TableCell>Age</TableCell>
									<TableCell>Gender</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Kindergarten</TableCell>
									<TableCell>Group reference</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{children.map((child) => (
									<TableRow key={child._id}>
										<TableCell>
											<Stack spacing={0.25}>
												<Typography className="dashboard-primary-text">{child.childFullName}</Typography>
												<Typography className="dashboard-muted-text">Child ID {truncateId(child._id)}</Typography>
											</Stack>
										</TableCell>
										<TableCell>{formatDate(child.childBirthDate)}</TableCell>
										<TableCell>{getAge(child.childBirthDate)}</TableCell>
										<TableCell>{child.childGender}</TableCell>
										<TableCell>
											<Chip label={getStatusLabel(child.childStatus)} size="small" sx={getStatusChipSx(child.childStatus)} />
										</TableCell>
										<TableCell>
											<Stack spacing={0.25}>
												<Typography className="dashboard-primary-text">
													{kindergartenNames[child.kindergartenId] || 'Kindergarten reference'}
												</Typography>
												<Typography className="dashboard-muted-text">{truncateId(child.kindergartenId)}</Typography>
											</Stack>
										</TableCell>
										<TableCell sx={{ maxWidth: 220 }}>
											<Stack spacing={0.25}>
												<Typography className="dashboard-primary-text">
													{groupsById[child.groupId]?.groupName || 'Group reference'}
												</Typography>
												{groupsById[child.groupId]?.groupAgeRange && (
													<Typography className="dashboard-muted-text">
														Age range {groupsById[child.groupId]?.groupAgeRange}
													</Typography>
												)}
												<Typography sx={{ wordBreak: 'break-all' }} className="dashboard-muted-text">
													{truncateId(child.groupId)}
												</Typography>
											</Stack>
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

export default ParentChildren;
