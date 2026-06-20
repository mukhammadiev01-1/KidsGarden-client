import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import {
	Chip,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { GET_ATTENDANCES, GET_CHILDREN, GET_GROUP } from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { Attendance } from '../../types/attendance/attendance';
import { Child } from '../../types/child/child';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel } from './dashboardUtils';

const ParentAttendance = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedChildId, setSelectedChildId] = useState('');
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

	const attendancesInput = useMemo(
		() => ({
			page: 1,
			limit: 50,
			sort: 'attendanceDate',
			search: {
				childId: selectedChildId,
			},
		}),
		[selectedChildId],
	);

	const { data: childrenData, loading: childrenLoading } = useQuery(GET_CHILDREN, {
		variables: { input: childrenInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const { data: attendancesData, loading: attendancesLoading } = useQuery(GET_ATTENDANCES, {
		variables: { input: attendancesInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT || !selectedChildId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const children: Child[] = childrenData?.getChildren?.list ?? [];
	const attendances: Attendance[] = attendancesData?.getAttendances?.list ?? [];
	const selectedChild = children.find((child) => child._id === selectedChildId);
	const groupIds = useMemo(() => Array.from(new Set(children.map((child) => child.groupId).filter(Boolean))), [children]);

	useEffect(() => {
		if (!selectedChildId && children.length > 0) {
			setSelectedChildId(children[0]._id);
		}
	}, [children, selectedChildId]);

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
		<Stack className="parent-dashboard-screen parent-attendance-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Attendance</Typography>
				<Typography sx={{ color: '#6b7280' }}>Review attendance history for your children.</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Select child</Typography>
						<Typography className="dashboard-panel-subtitle">
							Choose a child to review attendance records from their group.
						</Typography>
					</Stack>
					<Chip label={`${children.length} child${children.length === 1 ? '' : 'ren'}`} size="small" className="dashboard-count-chip" />
				</Stack>
				{childrenLoading && <Typography sx={{ color: '#6b7280' }}>Loading your children...</Typography>}
				{!childrenLoading && children.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No children are linked to your parent account yet. Please contact your kindergarten center.
					</Typography>
				)}
				{children.length > 0 && (
					<TextField
						select
						label="Child"
						value={selectedChildId}
						onChange={(event) => setSelectedChildId(event.target.value)}
						sx={{ maxWidth: 520 }}
					>
						{children.map((child) => (
							<MenuItem key={child._id} value={child._id}>
								{child.childFullName}
							</MenuItem>
						))}
					</TextField>
				)}
				{selectedChild && (
					<Stack className="dashboard-context-card">
						<Typography className="dashboard-primary-text">Showing attendance for {selectedChild.childFullName}</Typography>
						<Typography className="dashboard-muted-text">
							Group: {groupsById[selectedChild.groupId]?.groupName || 'Classroom'}
						</Typography>
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Attendance history</Typography>
						<Typography className="dashboard-panel-subtitle">
							Presence, absence, and staff notes for the selected child.
						</Typography>
					</Stack>
					<Chip label={`${attendances.length} records`} size="small" className="dashboard-count-chip" />
				</Stack>
				{attendancesLoading && <Typography sx={{ color: '#6b7280' }}>Loading attendance history...</Typography>}
				{!attendancesLoading && selectedChildId && attendances.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No attendance records found for this child yet.
					</Typography>
				)}
				{attendances.length > 0 && (
					<Stack className="parent-card-list parent-attendance-list">
						{attendances.map((attendance) => (
							<Stack key={attendance._id} className="parent-record-card parent-attendance-card" spacing={2}>
								<Stack className="parent-record-card-header">
									<Stack className="parent-record-title-block" spacing={0.5}>
										<Typography className="dashboard-primary-text parent-record-title parent-nowrap">
											{formatDate(attendance.attendanceDate)}
										</Typography>
									</Stack>
									<Chip
										label={getStatusLabel(attendance.attendanceStatus)}
										size="small"
										sx={getStatusChipSx(attendance.attendanceStatus)}
									/>
								</Stack>

								<Stack className="parent-record-grid parent-attendance-grid">
									<Stack className="parent-meta-item parent-meta-wide">
										<Typography className="parent-meta-label">Note</Typography>
										<Typography className="dashboard-note-text">{attendance.note || 'No note recorded'}</Typography>
									</Stack>
									<Stack className="parent-meta-item">
										<Typography className="parent-meta-label">Marked by</Typography>
										<Typography className="parent-meta-value">
											{attendance.markedBy ? 'Staff member' : 'Not available'}
										</Typography>
									</Stack>
								</Stack>
							</Stack>
						))}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default ParentAttendance;
