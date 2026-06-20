import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { GET_CHILDREN, GET_GROUP, GET_KINDERGARTEN } from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { Child } from '../../types/child/child';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';
import ParentTeacherChatPanel from '../chat/ParentTeacherChatPanel';
import { formatDate, getStatusChipSx, getStatusLabel } from './dashboardUtils';

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
		Record<
			string,
			Pick<Group, '_id' | 'kindergartenId' | 'groupName' | 'groupAgeRange' | 'groupCapacity' | 'teacherIds' | 'groupStatus'> | null
		>
	>({});
	const [activeChat, setActiveChat] = useState<{ childId: string; teacherId: string } | null>(null);

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

	const toggleChat = (childId: string, teacherId: string) => {
		setActiveChat((prev) => (prev?.childId === childId && prev?.teacherId === teacherId ? null : { childId, teacherId }));
	};

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

					return [kindergartenId, result.data?.getKindergarten?.kindergartenTitle || 'Kindergarten'] as const;
				} catch (err) {
					return [kindergartenId, 'Kindergarten'] as const;
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
					<Stack className="parent-card-list parent-children-list">
						{children.map((child) => {
							const group = groupsById[child.groupId];
							const teacherIds = group?.teacherIds ?? [];
							const activeTeacherId =
								activeChat?.childId === child._id && teacherIds.includes(activeChat.teacherId)
									? activeChat.teacherId
									: null;

							return (
								<Stack key={child._id} className="parent-record-card parent-child-card" spacing={2}>
									<Stack className="parent-record-card-header">
										<Stack className="parent-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text parent-record-title">
												{child.childFullName}
											</Typography>
											<Typography className="dashboard-muted-text parent-nowrap">
												Born {formatDate(child.childBirthDate)}
											</Typography>
										</Stack>
										<Chip label={getStatusLabel(child.childStatus)} size="small" sx={getStatusChipSx(child.childStatus)} />
									</Stack>

									<Stack className="parent-record-grid parent-child-grid">
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">Age / gender</Typography>
											<Typography className="parent-meta-value">
												{getAge(child.childBirthDate)} years / {child.childGender}
											</Typography>
										</Stack>
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">Kindergarten</Typography>
											<Typography className="parent-meta-value">
												{kindergartenNames[child.kindergartenId] || 'Kindergarten'}
											</Typography>
										</Stack>
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">Group / classroom</Typography>
											<Typography className="parent-meta-value">{group?.groupName || 'Classroom'}</Typography>
											{group?.groupAgeRange && (
												<Typography className="dashboard-muted-text">Age range {group.groupAgeRange}</Typography>
											)}
										</Stack>
									</Stack>

									<Stack className="parent-record-actions">
										{teacherIds.length > 0 ? (
											teacherIds.map((teacherId, index) => {
												const isActive = activeChat?.childId === child._id && activeChat.teacherId === teacherId;
												return (
													<Button key={teacherId} variant="outlined" onClick={() => toggleChat(child._id, teacherId)}>
														{isActive
															? 'Close Teacher Chat'
															: `Open Teacher Chat${teacherIds.length > 1 ? ` ${index + 1}` : ''}`}
													</Button>
												);
											})
										) : (
											<Typography className="dashboard-muted-text">No assigned teacher</Typography>
										)}
									</Stack>

									{activeTeacherId && (
										<ParentTeacherChatPanel
											childId={child._id}
											teacherId={activeTeacherId}
											title="Teacher chat"
											onClose={() => setActiveChat(null)}
										/>
									)}
								</Stack>
							);
						})}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default ParentChildren;
